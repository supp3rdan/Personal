import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from './store.jsx';

const KEY = 'abc:v1:timer';
const Ctx = createContext(null);

let audioCtx = null;
// Navegadores só liberam áudio após um toque do usuário: chamamos isto em cada interação do timer.
export function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* sem Web Audio */ }
}

function beep() {
  try {
    unlockAudio();
    const t0 = audioCtx.currentTime;
    [0, 0.25, 0.5].forEach((d, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = i === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.18);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0 + d);
      o.stop(t0 + d + 0.2);
    });
  } catch { /* sem som */ }
}

export function TimerProvider({ children }) {
  const { state } = useStore();
  const cfg = state.config;
  // O tempo é sempre calculado por timestamp: continua certo com a aba em segundo plano.
  const [timer, setTimer] = useState(() => {
    try {
      const t = JSON.parse(localStorage.getItem(KEY));
      if (!t || (t.pausedLeft == null && t.endAt <= Date.now())) return null; // já venceu
      return t;
    } catch { return null; }
  }); // { endAt, total, pausedLeft?, label? }
  const [now, setNow] = useState(Date.now());
  const [flash, setFlash] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    try {
      if (timer) localStorage.setItem(KEY, JSON.stringify(timer));
      else localStorage.removeItem(KEY);
    } catch { /* ignore */ }
  }, [timer]);

  const remaining = timer
    ? timer.pausedLeft != null ? timer.pausedLeft : Math.max(0, (timer.endAt - now) / 1000)
    : 0;
  const running = !!timer && timer.pausedLeft == null && remaining > 0;

  useEffect(() => {
    if (!timer || timer.pausedLeft != null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    const onVis = () => setNow(Date.now());
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [timer]);

  useEffect(() => {
    if (!timer || timer.pausedLeft != null) return;
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      if (cfg.som) beep();
      if (cfg.vibrar && navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 500]);
      setFlash(true);
      setTimeout(() => setFlash(false), 2400);
      setTimeout(() => setTimer((t) => (t && t.endAt <= Date.now() ? null : t)), 2500);
    }
  }, [remaining, timer, cfg.som, cfg.vibrar]);

  const start = useCallback((sec, label) => {
    unlockAudio();
    fired.current = false;
    setNow(Date.now());
    setTimer({ endAt: Date.now() + sec * 1000, total: sec, label: label || null });
  }, []);

  const add = useCallback((sec) => {
    unlockAudio();
    setTimer((t) => {
      if (!t) return null;
      if (t.pausedLeft != null) return { ...t, pausedLeft: t.pausedLeft + sec, total: t.total + sec };
      const left = Math.max(0, (t.endAt - Date.now()) / 1000);
      fired.current = false;
      return { ...t, endAt: Date.now() + (left + sec) * 1000, total: t.total + sec };
    });
  }, []);

  const togglePause = useCallback(() => {
    unlockAudio();
    setTimer((t) => {
      if (!t) return null;
      if (t.pausedLeft != null) return { ...t, endAt: Date.now() + t.pausedLeft * 1000, pausedLeft: null };
      return { ...t, pausedLeft: Math.max(0, (t.endAt - Date.now()) / 1000) };
    });
  }, []);

  const cancel = useCallback(() => { fired.current = false; setTimer(null); }, []);

  return (
    <Ctx.Provider value={{ timer, remaining, running, flash, start, add, togglePause, cancel }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTimer = () => useContext(Ctx);
