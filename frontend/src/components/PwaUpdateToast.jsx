import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Prompts the user to refresh when a new build's service worker is ready,
// instead of silently swapping the app shell underneath them (which can
// strand a mid-action user) or forcing an update loop.
const PwaUpdateToast = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="pwa-update-toast" role="status">
      <RefreshCw size={16} className="text-emerald" />
      <span>A new version of UrbanHeat is available.</span>
      <button type="button" className="pwa-update-btn" onClick={() => updateServiceWorker(true)}>
        Update
      </button>
      <button type="button" className="pwa-update-dismiss" onClick={() => setNeedRefresh(false)} aria-label="Dismiss update notice">
        <X size={16} />
      </button>
    </div>
  );
};

export default PwaUpdateToast;
