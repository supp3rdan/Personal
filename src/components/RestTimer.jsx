import { useState } from 'react';
import { Pause, Play, Plus, Timer as TimerIcon, X } from 'lucide-react';
import { useTimer } from '../state/timer.jsx';
import { formatTime } from '../lib/text.js';

const PRESETS = [45, 60, 90, 120];

/** Timer flutuante acima da barra de abas. Recolhido mostra só o tempo. */
export default function RestTimer() {
  const t = useTimer();
  const [aberto, setAberto] = useState(false);
  const ativo = !!t.timer;
  const pausado = t.timer?.pausedLeft != null;
  const pct = ativo ? Math.min(100, (1 - t.remaining / t.timer.total) * 100) : 0;
  const acabou = ativo && t.remaining <= 0;

  return (
    <>
      {t.flash && <div className="pointer-events-none fixed inset-0 z-[60] animate-flash bg-accent" aria-hidden="true" />}
      <div role="status" aria-live="assertive" className="sr-only">{acabou ? 'Descanso finalizado' : ''}</div>

      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-3 z-40 flex flex-col items-end gap-2">
        {aberto && (
          <div className="w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-card p-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Descanso</span>
              <button type="button" onClick={() => setAberto(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-muted" aria-label="Recolher timer">
                <X size={18} />
              </button>
            </div>
            {ativo && (
              <>
                <div className={`py-1 text-center text-5xl font-black tabular-nums ${acabou ? 'text-success' : 'text-white'}`}>
                  {acabou ? 'Bora!' : formatTime(t.remaining)}
                </div>
                {t.timer.label && <p className="truncate text-center text-xs text-muted">após {t.timer.label}</p>}
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => t.add(15)} className="flex h-12 items-center justify-center gap-1 rounded-xl bg-line font-bold text-white"><Plus size={16} />15s</button>
                  <button type="button" onClick={t.togglePause} className="flex h-12 items-center justify-center rounded-xl bg-line text-white" aria-label={pausado ? 'Continuar' : 'Pausar'}>
                    {pausado ? <Play size={20} /> : <Pause size={20} />}
                  </button>
                  <button type="button" onClick={t.cancel} className="h-12 rounded-xl bg-line text-sm font-bold text-white">Cancelar</button>
                </div>
              </>
            )}
            <div className="mt-3 grid grid-cols-4 gap-2">
              {PRESETS.map((s) => (
                <button key={s} type="button" onClick={() => t.start(s)} className="h-12 rounded-xl border border-accent/40 bg-accent/10 font-bold text-accent active:bg-accent active:text-bg">
                  {s}s
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          aria-label={ativo ? `Timer de descanso: ${formatTime(t.remaining)}` : 'Abrir timer de descanso'}
          className={`flex h-14 items-center justify-center gap-2 rounded-full font-black shadow-xl transition-colors ${
            ativo ? `px-5 ${acabou ? 'bg-success text-bg' : 'bg-accent text-bg'}` : 'w-14 border border-line bg-card text-white'
          }`}
        >
          <TimerIcon size={22} aria-hidden="true" />
          {ativo && <span className="text-xl tabular-nums">{acabou ? '0:00' : formatTime(t.remaining)}</span>}
        </button>
      </div>
    </>
  );
}
