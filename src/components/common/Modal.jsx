import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

const EXIT_MS = 180;

/**
 * Modal accesible sobre <dialog> nativo: foco atrapado, Escape y capa superior
 * gratis. En móvil se presenta como hoja inferior.
 */
export default function Modal({ open, onClose, title, description, children, footer, size = 'md', className = '', hideHeader = false }) {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mounted) return undefined;
    setClosing(true);
    const t = setTimeout(() => {
      ref.current?.close();
      setMounted(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const d = ref.current;
    if (mounted && d && !d.open) {
      d.showModal();
      // El dialog enfoca su primer control; se respeta el campo marcado con data-autofocus.
      d.querySelector('[data-autofocus]')?.focus();
    }
    document.documentElement.classList.toggle('has-modal', mounted);
    return () => document.documentElement.classList.remove('has-modal');
  }, [mounted]);

  if (!mounted) return null;

  return (
    <dialog
      ref={ref}
      className={`modal-dialog-native size-${size} ${className}`}
      data-closing={closing || undefined}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal-panel">
        {!hideHeader && (
          <header className="modal-head">
            <div className="min-w-0">
              {title && <h2 id={titleId} className="modal-title">{title}</h2>}
              {description && <p id={descId} className="modal-desc">{description}</p>}
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
              <X size={20} />
            </button>
          </header>
        )}
        {hideHeader && title && <h2 id={titleId} className="visually-hidden">{title}</h2>}
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </dialog>
  );
}
