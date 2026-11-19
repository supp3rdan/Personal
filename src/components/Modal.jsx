import { useRef } from 'react';
import { X } from 'lucide-react';
import { useBackClose, useFocusTrap } from '../lib/hooks.js';

/** Bottom sheet acessível: foco preso, Esc, toque fora e "voltar" do celular fecham. */
export default function Modal({ open, onClose, title, children, labelledBy = 'modal-title' }) {
  const ref = useRef(null);
  useFocusTrap(ref, open, onClose);
  useBackClose(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl border border-line bg-card shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <h2 id={labelledBy} className="min-w-0 flex-1 truncate text-lg font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full bg-line text-white active:bg-accent active:text-bg" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{children}</div>
      </div>
    </div>
  );
}
