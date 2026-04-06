import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { safeSetItem, safeGetItem, safeGetProfile } from './safeStorage';

/**
 * Attribution & durable player identity.
 *
 * Problem: Safari ITP / Firefox ETP nuke browser-level identity within hours,
 * so returning mobile-web players look like new users and D1 is artificially low.
 *
 * Solution: On first visit, generate a durable fingerprint stored in SDK appStorage
 * (which goes through the platform bridge, not the browser cookie jar). Every session
 * fires an attribution event with the durable ID + campaign/device/platform info so
 * you can stitch returning players even if profile.id changes.
 */

// Storage keys
const KEY_DURABLE_ID = 'attr_durable_id';
const KEY_FIRST_SEEN = 'attr_first_seen';
const KEY_FIRST_PLATFORM = 'attr_first_platform';
const KEY_FIRST_CLIENT = 'attr_first_client';
const KEY_FIRST_CAMPAIGN = 'attr_first_campaign';
const KEY_SESSION_COUNT = 'attr_session_count';

interface CampaignParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  campaign: string;
  ref: string;
  referredBy: string;
  fbclid: string;
  gclid: string;
}

interface DeviceSnapshot {
  platform: string;
  platform_version: string;
  browser: string;
  user_agent: string;
  is_mobile_browser: boolean;
  is_tablet: boolean;
  language: string;
  device_type: string;
  screen_width: number;
  screen_height: number;
  pixel_ratio: number;
  orientation: string;
  client: string;
}

/** Generate a random ID without crypto dependency issues. */
function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for older browsers
    return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
  }
}

/** Read UTM params from the browser URL (Facebook/Google Ads append these). */
function getUrlParams(): Partial<CampaignParams> {
  try {
    const params = new URLSearchParams(window.location.search);
    const out: Partial<CampaignParams> = {};
    const keys: (keyof CampaignParams)[] = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
      'utm_term', 'campaign', 'ref', 'referredBy',
    ];
    for (const k of keys) {
      const v = params.get(k);
      if (v) out[k] = v;
    }
    // Facebook click ID — lets you match back to the exact ad click
    const fbclid = params.get('fbclid');
    if (fbclid) {
      out.fbclid = fbclid;
      out.ref = out.ref || 'facebook';
      out.utm_source = out.utm_source || 'facebook';
    }
    // Google click ID — lets you match back to the exact ad click
    const gclid = params.get('gclid');
    if (gclid) {
      out.gclid = gclid;
      out.ref = out.ref || 'google';
      out.utm_source = out.utm_source || 'google';
    }
    return out;
  } catch {
    return {};
  }
}

/** Read campaign/referral params from share context + URL. */
function getCampaignParams(): Partial<CampaignParams> {
  // URL params first (from ad click-throughs), then SDK share params as override
  const fromUrl = getUrlParams();
  const fromSdk: Partial<CampaignParams> = {};
  try {
    const sp = RundotGameAPI.context.shareParams;
    if (sp && typeof sp === 'object') {
      const keys: (keyof CampaignParams)[] = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
        'utm_term', 'campaign', 'ref', 'referredBy',
      ];
      for (const k of keys) {
        const v = (sp as Record<string, unknown>)[k];
        if (v) fromSdk[k] = String(v);
      }
    }
  } catch { /* SDK not ready */ }

  // Merge: SDK params take priority over URL params
  return { ...fromUrl, ...fromSdk };
}

/** Get device + platform info from SDK. */
function getDeviceInfo(): DeviceSnapshot {
  const info: DeviceSnapshot = {
    platform: 'unknown',
    platform_version: 'unknown',
    browser: 'unknown',
    user_agent: '',
    is_mobile_browser: false,
    is_tablet: false,
    language: 'unknown',
    device_type: 'unknown',
    screen_width: 0,
    screen_height: 0,
    pixel_ratio: 1,
    orientation: 'unknown',
    client: 'unknown',
  };

  try {
    const env = RundotGameAPI.system.getEnvironment();
    info.platform = env.platform ?? 'unknown';
    info.platform_version = env.platformVersion ?? 'unknown';
    if (env.browserInfo) {
      info.browser = env.browserInfo.browser ?? 'unknown';
      info.user_agent = (env.browserInfo.userAgent ?? '').slice(0, 200);
      info.is_mobile_browser = !!env.browserInfo.isMobile;
      info.is_tablet = !!env.browserInfo.isTablet;
      info.language = env.browserInfo.language ?? 'unknown';
    }
  } catch { /* SDK not ready */ }

  try {
    const device = RundotGameAPI.system.getDevice();
    info.device_type = device.deviceType ?? 'unknown';
    info.screen_width = device.screenSize?.width ?? 0;
    info.screen_height = device.screenSize?.height ?? 0;
    info.pixel_ratio = device.pixelRatio ?? 1;
    info.orientation = device.orientation ?? 'unknown';
  } catch { /* SDK not ready */ }

  try {
    const isMobile = RundotGameAPI.system.isMobile();
    const isWeb = RundotGameAPI.system.isWeb();
    if (isWeb) {
      info.client = isMobile ? 'mobile_web' : 'desktop_web';
    } else {
      info.client = 'app';
    }
  } catch { /* keep 'unknown' */ }

  return info;
}

/** Fire-and-forget analytics event (mirrors analytics.ts pattern). */
function fireEvent(name: string, params: Record<string, unknown>) {
  try {
    Promise.race([
      RundotGameAPI.analytics.recordCustomEvent(name, params),
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ]).catch(() => {});
  } catch { /* swallow */ }
}

/**
 * Run on every game launch. Handles:
 * 1. First-ever visit: generate durable ID, record first-seen attribution
 * 2. Returning visit: increment session count, detect platform migration
 * 3. Every visit: fire session_attribution event with full context
 */
export async function trackAttribution() {
  const now = new Date().toISOString();

  // Load existing attribution data (all in parallel)
  const [durableId, firstSeen, firstPlatform, firstClient, firstCampaign, sessionCountRaw] =
    await Promise.all([
      safeGetItem(KEY_DURABLE_ID),
      safeGetItem(KEY_FIRST_SEEN),
      safeGetItem(KEY_FIRST_PLATFORM),
      safeGetItem(KEY_FIRST_CLIENT),
      safeGetItem(KEY_FIRST_CAMPAIGN),
      safeGetItem(KEY_SESSION_COUNT),
    ]);

  const isFirstSession = !durableId;
  const id = durableId || generateId();
  const sessionCount = (parseInt(sessionCountRaw || '0', 10) || 0) + 1;

  // Get current context
  const device = getDeviceInfo();
  const campaign = getCampaignParams();
  const profile = safeGetProfile();

  const currentPlatform = device.platform;
  const currentClient = device.client;
  const campaignStr = campaign.utm_campaign || campaign.campaign || '';

  // --- First session: persist first-seen data ---
  if (isFirstSession) {
    // Fire all writes in parallel — none depend on each other
    safeSetItem(KEY_DURABLE_ID, id);
    safeSetItem(KEY_FIRST_SEEN, now);
    safeSetItem(KEY_FIRST_PLATFORM, currentPlatform);
    safeSetItem(KEY_FIRST_CLIENT, currentClient);
    if (campaignStr) {
      safeSetItem(KEY_FIRST_CAMPAIGN, campaignStr);
    }

    // Fire first-touch event with everything we know
    fireEvent('first_touch_attribution', {
      durable_id: id,
      profile_id: profile?.id ?? 'unknown',
      is_anonymous: profile?.isAnonymous ?? true,
      first_seen: now,
      // Campaign
      ...campaign,
      // Device & platform
      ...device,
      // Timestamp
      timestamp: now,
    });
  }

  // --- Always: increment session count ---
  safeSetItem(KEY_SESSION_COUNT, String(sessionCount));

  // --- Detect platform migration (e.g. mobile_web → app) ---
  if (!isFirstSession && firstClient && currentClient !== firstClient) {
    fireEvent('platform_migration', {
      durable_id: id,
      profile_id: profile?.id ?? 'unknown',
      is_anonymous: profile?.isAnonymous ?? true,
      from_platform: firstPlatform || 'unknown',
      from_client: firstClient,
      to_platform: currentPlatform,
      to_client: currentClient,
      first_seen: firstSeen || 'unknown',
      original_campaign: firstCampaign || '',
      session_count: sessionCount,
      timestamp: now,
    });
  }

  // --- Every session: fire attribution heartbeat ---
  fireEvent('session_attribution', {
    durable_id: id,
    profile_id: profile?.id ?? 'unknown',
    is_anonymous: profile?.isAnonymous ?? true,
    is_first_session: isFirstSession,
    session_count: sessionCount,
    // First-touch info (for stitching)
    first_seen: isFirstSession ? now : (firstSeen || 'unknown'),
    first_platform: isFirstSession ? currentPlatform : (firstPlatform || 'unknown'),
    first_client: isFirstSession ? currentClient : (firstClient || 'unknown'),
    first_campaign: isFirstSession ? campaignStr : (firstCampaign || ''),
    // Current session info
    current_platform: currentPlatform,
    current_client: currentClient,
    // Campaign (if they came through a link this time)
    ...campaign,
    // Device details
    device_type: device.device_type,
    screen_width: device.screen_width,
    screen_height: device.screen_height,
    pixel_ratio: device.pixel_ratio,
    orientation: device.orientation,
    browser: device.browser,
    language: device.language,
    is_mobile_browser: device.is_mobile_browser,
    is_tablet: device.is_tablet,
    // Timestamp
    timestamp: now,
  });
}
