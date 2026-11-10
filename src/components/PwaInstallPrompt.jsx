import { useEffect, useState } from 'react';
import { Smartphone, X, Download } from 'lucide-react';

export default function PwaInstallPrompt({ deferredPrompt, onInstall, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(Boolean(deferredPrompt));
  }, [deferredPrompt]);

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="pwa-banner" role="region" aria-label="تثبيت التطبيق">
      <div className="pwa-banner-info">
        <span className="pwa-banner-icon">
          <Smartphone size={20} />
        </span>
        <div>
          <strong>ثبّت تطبيق Storybook على هاتفك</strong>
          <p>لفتح القصص بسرعة والعمل كتطبيق مستقل على أندرويد.</p>
        </div>
      </div>
      <div className="pwa-banner-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={onInstall}>
          <Download size={16} />
          <span>تثبيت</span>
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
          aria-label="تجاهل"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
