import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare } from 'lucide-react';

const DISMISS_KEY = 'urbanheat-install-dismissed-at';
const DISMISS_SNOOZE_MS = 1000 * 60 * 60 * 24 * 7; // don't re-nag for 7 days

const isStandalone = () => (
  window.matchMedia?.('(display-mode: standalone)').matches
  || window.navigator.standalone === true // iOS Safari
);

const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// Real native install flow only — no fake "download" that just saves the
// HTML page, and no claiming success until the browser actually reports it.
const InstallAppButton = ({ variant = 'inline' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [dismissed, setDismissed] = useState(() => {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at > 0 && Date.now() - at < DISMISS_SNOOZE_MS;
  });
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (installed) return undefined;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [installed]);

  if (installed || dismissed) return null;

  // Chrome/Edge/Android: real native prompt was captured.
  // iOS Safari (and any other browser without beforeinstallprompt support):
  // there is no programmatic install API, so show the real manual steps
  // instead of a button that would silently do nothing.
  const canPromptNatively = Boolean(deferredPrompt);
  if (!canPromptNatively && !isIOS()) return null;

  const handleClick = async () => {
    if (canPromptNatively) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      // Whatever the user chose, this specific prompt instance is spent —
      // Chrome will not let it be reused, and won't fire another one for a
      // while either way, so just clear it either way.
      setDeferredPrompt(null);
      if (outcome !== 'accepted') {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setDismissed(true);
      }
      return;
    }
    // iOS: no native prompt exists — show the manual instructions instead.
    setShowIosHint(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <div className={`install-app-wrap ${variant}`}>
      <button type="button" className="install-app-btn" onClick={handleClick} aria-label="Install UrbanHeat">
        <Download size={17} />
        <span>Install UrbanHeat</span>
      </button>
      {variant === 'banner' && (
        <button type="button" className="install-app-dismiss" onClick={handleDismiss} aria-label="Dismiss install suggestion">
          Not now
        </button>
      )}

      {showIosHint && (
        <div className="install-ios-hint" role="status">
          <p>
            <Share size={14} /> Tap <strong>Share</strong>, then <PlusSquare size={14} /> <strong>Add to Home Screen</strong>.
          </p>
          <button type="button" onClick={() => setShowIosHint(false)} aria-label="Close instructions">Got it</button>
        </div>
      )}
    </div>
  );
};

export default InstallAppButton;
