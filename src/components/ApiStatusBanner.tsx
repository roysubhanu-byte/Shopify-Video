// src/components/ApiStatusBanner.tsx
import { useEffect, useState } from 'react';
import { waitForApi } from '../lib/apiHealth';
import { API_URL } from '../lib/config';

export function ApiStatusBanner() {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // one quick check is enough (we only need true/false)
      const ok = await waitForApi(1, 0);
      if (mounted) setHealthy(ok);
    })();
    return () => { mounted = false; };
  }, []);

  // while checking, show nothing
  if (healthy === null) return null;

  // healthy → no banner
  if (healthy) return null;

  // only show if the check failed
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        color: '#ffd6d9',
        background: '#2a0f12',
        border: '1px solid #5b1a20',
        fontSize: 14,
      }}
      role="alert"
    >
      Unable to reach API at <strong>{API_URL}</strong>.&nbsp;
      Check your <code>VITE_API_URL</code> on Vercel and CORS on the API.
    </div>
  );
}
