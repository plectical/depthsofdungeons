import { useState, useEffect } from 'react';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

/**
 * Hook to load an image from the CDN assets folder.
 * Returns a blob URL string or null while loading.
 * Uses a 10s timeout to prevent slow CDN fetches from hanging on mobile.
 */
export function useCdnImage(assetPath: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    RundotGameAPI.cdn.fetchAsset(assetPath, { timeout: 10000 }).then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      revoke = blobUrl;
      setUrl(blobUrl);
    }).catch(() => {
      // Fallback to public path
      setUrl('/' + assetPath);
    });
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [assetPath]);

  return url;
}
