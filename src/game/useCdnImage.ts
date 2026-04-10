import { useState, useEffect } from 'react';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

/**
 * Fetch a CDN asset with retry + exponential backoff.
 * Addresses the #1 production error: iOS "Load failed" (9,442 occurrences)
 * where transient network drops cause a single fetch to fail permanently.
 */
async function fetchAssetWithRetry(
  assetPath: string,
  maxRetries = 3,
  baseDelay = 500,
): Promise<Blob> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await RundotGameAPI.cdn.fetchAsset(assetPath, { timeout: 10000 });
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Hook to load an image from the CDN assets folder.
 * Returns a blob URL string or null while loading.
 * Retries up to 3 times with exponential backoff before falling back to public path.
 */
export function useCdnImage(assetPath: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;

    fetchAssetWithRetry(assetPath).then((blob) => {
      if (cancelled) return;
      const blobUrl = URL.createObjectURL(blob);
      revoke = blobUrl;
      setUrl(blobUrl);
    }).catch(() => {
      if (cancelled) return;
      setUrl('/' + assetPath);
    });

    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [assetPath]);

  return url;
}
