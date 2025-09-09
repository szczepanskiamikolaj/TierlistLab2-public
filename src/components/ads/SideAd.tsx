'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const SideAd = () => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!adRef.current) return;

    try {
      if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current.innerHTML.trim() === "") {
        // Only push if ad not already rendered
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense Error", e);
    }
  }, []);

  return (
    <aside
      style={{
        width: '160px',
        height: '600px',
        position: 'fixed',
        top: '100px',
        right: '10px',
        zIndex: 999,
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '160px', height: '600px' }}
        data-ad-client="ca-pub-9614316154472722"
        data-ad-slot="8691787890"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};

export default SideAd;
