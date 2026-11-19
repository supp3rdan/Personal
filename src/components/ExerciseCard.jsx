import { Check, Info, Minus, Plus, Timer as TimerIcon, Repeat, Trash2 } from 'lucide-react';
import ExerciseMedia from './ExerciseMedia.jsx';
import { MUSCULOS } from '../lib/labels.js';
import { prescribe, repsLabel } from '../lib/prescription.js';
import { formatDate } from '../lib/text.js';
import { useStore } from '../state/store.jsx';
import { useTimer } from '../state/timer.jsx';

function Stepper({ label, value, onChange, step, unit, placeholder }) {
  const num = value === '' || value == null ? '' : value;
  const bump = (d) => {
    const base = Number(num || placeholder || 0);
    const next = Math.max(0, Math.round((base + d) * 10) / 10);
    onChange(next);
  };
  return (
    <div className="flex-1">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <div className="flex h-12 items-center rounded-xl border border-line bg-bg">
        <button type="button" onClick={() => bump(-step)} className="flex h-12 w-11 items-center justify-center text-muted active:text-accent" aria-label={`Diminuir ${label}`}>
          <Minus size={18} />
        </button>
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          value={num}
          placeholder={placeholder != null ? String(placeholder) : '0'}
          onChange={(e) => onChange(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
          className="h-12 w-full min-w-0 bg-transparent text-center text-lg font-bold tabular-nums text-white placeholder:text-muted/50 focus:outline-none"
          aria-label={`${label} (${unit})`}
        />
        <button type="button" onClick={() => bump(step)} className="flex h-12 w-11 items-center justify-center text-muted active:text-accent" aria-label={`Aumentar ${label}`}>
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

export default function ExerciseCard({ ex, slotId, treino, ordem, extra = false, onOpen, onRemove }) {
  const { state, dispatch } = useStore();
  const timer = useTimer();
  const p = prescribe(ex, state.nivel);
  const checks = state.checks?.[state.perfil]?.[treino]?.[ex.id] || [];
  const feitas = Array.from({ length: p.series }, (_, i) => !!checks[i]);
  const concluidas = feitas.filter(Boolean).length;
  const completo = concluidas === p.series;
  const carga = state.cargas[ex.id] || {};
  const atual = carga.atual || {};
  const ultima = carga.ultima;
  const segundos = p.unidade === 's';

  const toggle = (idx) => {
    const marcando = !feitas[idx];
    dispatch({ type: 'toggleSerie', treino, exId: ex.id, idx, total: p.series });
    if (marcando && navigator.vibrate && state.config.vibrar) navigator.vibrate(30);
    // descanso automático, exceto depois da última série do exercício
    const fimDoExercicio = marcando && concluidas + 1 === p.series;
    if (marcando && state.config.autoDescanso && !fimDoExercicio) timer.start(p.descansoSeg, ex.nome);
  };

  return (
    <article className={`rounded-2xl border bg-card p-3 transition-colors ${completo ? 'border-success/60' : 'border-line'}`}>
      <button type="button" onClick={() => onOpen(ex, slotId)} className="flex w-full items-start gap-3 text-left" aria-label={`Ver detalhes de ${ex.nome}`}>
        <ExerciseMedia ex={ex} className="h-20 w-20 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent">
            <span>#{ordem}</span>
            {extra && <span className="rounded bg-line px-1.5 py-0.5 text-[10px] uppercase text-muted">extra</span>}
            <span className="text-muted">·</span>
            <span>{MUSCULOS[ex.musculoPrincipal]}</span>
            {completo && <Check size={16} className="ml-auto text-success" aria-label="Exercício concluído" />}
          </div>
          <h3 className="mt-0.5 text-base font-bold leading-snug text-white">{ex.nome}</h3>
          {ex.musculosSecundarios.length > 0 && (
            <p className="truncate text-xs text-muted">+ {ex.musculosSecundarios.map((m) => MUSCULOS[m] || m).join(', ')}</p>
          )}
        </div>
        <Info size={20} className="shrink-0 text-muted" aria-hidden="true" />
      </button>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-lg bg-accent/15 px-2 py-1 font-bold text-accent">{p.series} × {repsLabel(p)}</span>
        <span className="flex items-center gap-1 rounded-lg bg-line px-2 py-1 text-muted"><TimerIcon size={12} aria-hidden="true" />{p.descansoSeg}s</span>
        <span className="rounded-lg bg-line px-2 py-1 text-muted">{ex.cadencia}</span>
      </div>

      <p className="mt-2 text-sm leading-snug text-muted"><span className="font-semibold text-white/90">Dica: </span>{ex.dicaSeguranca}</p>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6" role="group" aria-label="Séries">
        {feitas.map((ok, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            aria-pressed={ok}
            aria-label={`Série ${i + 1}${ok ? ' concluída' : ''}`}
            className={`flex h-12 items-center justify-center rounded-xl border text-base font-bold transition-colors ${
              ok ? 'border-success bg-success text-bg' : 'border-line bg-bg text-white active:border-accent'
            }`}
          >
            {ok ? <Check size={20} strokeWidth={3} /> : `S${i + 1}`}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        {!segundos && ex.equipamento !== 'peso-corporal' && (
          <Stepper
            label="Carga (kg)"
            unit="kg"
            step={0.5}
            value={atual.kg}
            placeholder={ultima?.kg ?? undefined}
            onChange={(kg) => dispatch({ type: 'carga', exId: ex.id, value: { kg } })}
          />
        )}
        <Stepper
          label={segundos ? 'Tempo (s)' : 'Reps feitas'}
          unit={segundos ? 'segundos' : 'repetições'}
          step={1}
          value={atual.reps}
          placeholder={ultima?.reps ?? undefined}
          onChange={(reps) => dispatch({ type: 'carga', exId: ex.id, value: { reps } })}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {ultima
            ? <>Última vez: <span className="font-semibold text-white">{ultima.kg != null && ultima.kg !== '' ? `${ultima.kg} kg` : ''}{ultima.kg && ultima.reps ? ' × ' : ''}{ultima.reps ?? ''}{segundos ? ' s' : ''}</span> · {formatDate(ultima.data)}</>
            : 'Sem registro anterior'}
        </p>
        {extra ? (
          <button type="button" onClick={() => onRemove(ex)} className="flex h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-red-300 active:bg-red-500/10">
            <Trash2 size={14} aria-hidden="true" /> Remover
          </button>
        ) : (
          <button type="button" onClick={() => onOpen(ex, slotId, true)} className="flex h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-accent active:bg-accent/10">
            <Repeat size={14} aria-hidden="true" /> Trocar
          </button>
        )}
      </div>
    </article>
  );
}
