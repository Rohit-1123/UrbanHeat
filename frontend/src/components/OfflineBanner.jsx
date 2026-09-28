import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

// Reflects the browser's real connectivity state — never a guess. The app
// shell can still open offline (service worker precache), but live
// environmental/route data cannot, so we say so explicitly rather than
// showing stale cached numbers as if current.
const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="alert">
      <WifiOff size={15} />
      <span>You are offline. Live environmental data is unavailable.</span>
    </div>
  );
};

export default OfflineBanner;
