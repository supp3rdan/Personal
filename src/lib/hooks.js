import { useEffect, useRef, useState } from 'react';

export function useDebounce(value, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Mantém a tela ligada enquanto `active` for true (Wake Lock API, quando existir). */
export function useWakeLock(active) {
  const lock = useRef(null);
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let cancelled = false;
    const request = async () => {
      try {
        if (document.visibilityState !== 'visible') return;
        lock.current = await navigator.wakeLock.request('screen');
        if (cancelled) lock.current.release();
      } catch { /* negado ou sem suporte */ }
    };
    request();
    // o sistema libera o lock quando a aba fica oculta; pedimos de novo ao voltar
    const onVis = () => { if (document.visibilityState === 'visible') request(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      lock.current?.release?.().catch(() => {});
      lock.current = null;
    };
  }, [active]);
}

/** Prende o foco dentro de um elemento (modais). */
export function useFocusTrap(ref, open, onClose) {
  useEffect(() => {
    if (!open || !ref.current) return undefined;
    const el = ref.current;
    const prev = document.activeElement;
    const sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const first = () => el.querySelectorAll(sel)[0];
    (first() || el).focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll(sel)].filter((n) => !n.disabled);
      if (!items.length) return;
      const a = items[0];
      const b = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    };
    el.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      el.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, ref, onClose]);
}

// Quantos "popstate" fomos nós que provocamos (ao fechar pelo botão do app)
let ignorePops = 0;

/** Fecha o modal com o gesto/botão "voltar" do celular. */
export function useBackClose(open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const tag = { modal: Math.random() };
    window.history.pushState(tag, '');
    let poppedByBack = false;
    const onPop = () => {
      if (ignorePops > 0) { ignorePops -= 1; return; }
      poppedByBack = true;
      closeRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // fechado pelo botão do app: desfaz a entrada que criamos no histórico
      if (!poppedByBack && window.history.state?.modal === tag.modal) {
        ignorePops += 1;
        window.history.back();
      }
    };
  }, [open]);
}
