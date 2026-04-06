import { useState, useEffect, useRef, useCallback } from 'react';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { safeSetItem, safeGetItem } from './safeStorage';

const STORAGE_KEY = 'music_muted';

export function useMusic(assetPath: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [muted, setMuted] = useState(true); // start muted until user taps
  const [ready, setReady] = useState(false);
  const hasInteractedRef = useRef(false);

  // Load the audio file from CDN
  useEffect(() => {
    let cancelled = false;

    // Check saved mute preference
    safeGetItem(STORAGE_KEY).then((val) => {
      if (!cancelled && val === 'false') {
        setMuted(false);
      }
    });

    RundotGameAPI.cdn.fetchAsset(assetPath, { timeout: 60000 }).then((blob) => {
      if (cancelled) return;
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.4;
      audioRef.current = audio;
      setReady(true);
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [assetPath]);

  // Play or pause based on muted state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !ready) return;

    if (!muted && hasInteractedRef.current) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [muted, ready]);

  const toggleMute = useCallback(() => {
    hasInteractedRef.current = true;
    setMuted((prev) => {
      const next = !prev;
      safeSetItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Call this on first user interaction to allow autoplay
  const onUserInteraction = useCallback(() => {
    if (hasInteractedRef.current) return;
    hasInteractedRef.current = true;
    if (!muted && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [muted]);

  return { muted, toggleMute, onUserInteraction };
}
