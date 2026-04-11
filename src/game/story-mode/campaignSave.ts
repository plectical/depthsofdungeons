import { safeSetItem, safeGetItem } from '../safeStorage';
import { reportError } from '../errorReporting';
import type { CampaignSave } from './campaignTypes';
import { CAMPAIGN_SAVE_VERSION } from './campaignTypes';

const SAVE_KEY = 'story_campaign';

export async function saveCampaign(save: CampaignSave): Promise<void> {
  try {
    save.version = CAMPAIGN_SAVE_VERSION;
    await safeSetItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {
    reportError('campaign_save', e);
  }
}

export async function loadCampaign(): Promise<CampaignSave | null> {
  try {
    const raw = await safeGetItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw) as CampaignSave;
    if (!save.version || !save.playerClass) return null;
    // Future: migration logic if version < CAMPAIGN_SAVE_VERSION
    return save;
  } catch (e) {
    reportError('campaign_load', e);
    return null;
  }
}

export async function deleteCampaign(): Promise<void> {
  try {
    const RundotGameAPI = (await import('@series-inc/rundot-game-sdk/api')).default;
    await RundotGameAPI.appStorage.removeItem(SAVE_KEY);
  } catch { /* best effort */ }
  try { localStorage.removeItem('dod_backup_' + SAVE_KEY); } catch { /* ok */ }
}

/**
 * Save a checkpoint by serializing the current GameState JSON into the campaign save.
 * Called at the start of each floor that has `hasCheckpoint: true`.
 */
export async function saveCheckpoint(save: CampaignSave, gameStateJson: string): Promise<void> {
  save.checkpointState = gameStateJson;
  await saveCampaign(save);
}
