import { useEffect, useState } from 'react';
import { Smartphone, X, Download } from 'lucide-react';

export default function PwaInstallPrompt({ deferredPrompt, onInstall, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(Boolean(deferredPrompt));
  }, [deferredPrompt]);

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="pwa-banner" role="region" aria-label="Install App">
      <div className="pwa-banner-info">
        <span className="pwa-banner-icon">
          <Smartphone size={20} />
        </span>
        <div>
          <strong>Install Storybook on Your Device</strong>
          <p>Launch stories quickly and use it like a standalone Android app.</p>
        </div>
      </div>
      <div className="pwa-banner-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={onInstall}>
          <Download size={16} />
          <span>Install</span>
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
