import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      className={`toast ${isError ? 'toast-error' : 'toast-success'}`}
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
    >
      <span className="toast-icon">
        {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      </span>
      <span className="toast-msg">{toast.message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={onDismiss}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
