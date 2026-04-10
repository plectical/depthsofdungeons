import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

export function AdBanner() {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded (adblocker, localhost, etc.)
    }
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      background: '#000',
      pointerEvents: 'auto',
    }}>
      <div ref={adRef}>
        <ins
          className="adsbygoogle"
          style={{ display: 'inline-block', width: 320, height: 50 }}
          data-ad-client="ca-pub-1220411708747471"
          data-ad-slot="5575876480"
        />
      </div>
    </div>
  );
}
