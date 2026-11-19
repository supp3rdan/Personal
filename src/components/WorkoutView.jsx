import { ArrowLeft, Flag, Plus, Sparkles } from 'lucide-react';
import ExerciseCard from './ExerciseCard.jsx';
import { useStore, workoutStats } from '../state/store.jsx';
import { WORKOUTS, NEXT } from '../data/workouts.js';
import { NIVEIS } from '../lib/labels.js';
import { prescribe } from '../lib/prescription.js';
import { useWakeLock } from '../lib/hooks.js';

export default function WorkoutView({ treino, onBack, onSwitch, onOpen, onToast, onAddExercise }) {
  const { state, dispatch } = useStore();
  const info = WORKOUTS[state.perfil][treino];
  const { slots, total, feitas, pct } = workoutStats(state, treino, prescribe);
  const checks = state.checks?.[state.perfil]?.[treino] || {};
  const proximo = state.proximo?.[state.perfil] || 'A';

  useWakeLock(feitas > 0 && pct < 100);

  const finalizar = () => {
    if (feitas === 0) { onToast('Marque pelo menos uma série antes de finalizar.'); return; }
    if (pct < 100 && !window.confirm(`Você fez ${pct}% do treino. Finalizar mesmo assim?`)) return;
    const itens = slots.map(({ ex }) => {
      const n = prescribe(ex, state.nivel).series;
      const at = state.cargas[ex.id]?.atual || {};
      return { id: ex.id, nome: ex.nome, series: (checks[ex.id] || []).slice(0, n).filter(Boolean).length, kg: at.kg ?? null, reps: at.reps ?? null };
    });
    dispatch({ type: 'finalizar', treino, itens });
    onToast(`Treino ${treino} concluído! Próximo: Treino ${NEXT[treino]}.`);
    onBack();
  };

  return (
    <div className="space-y-3">
      <div className="sticky top-[var(--header-h)] z-20 -mx-4 border-b border-line bg-bg/95 px-4 pb-3 pt-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onBack} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white active:bg-line" aria-label="Voltar para os treinos">
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-accent">Treino {treino}</p>
            <h2 className="text-lg font-black leading-tight text-white">{info.nome}</h2>
            <p className="text-xs text-muted">{feitas} de {total} séries · nível {NIVEIS[state.nivel]}</p>
          </div>
          <span className="pl-2 text-xl font-black tabular-nums text-accent" aria-hidden="true">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do treino">
          <div className={`h-full rounded-full transition-[width] duration-200 ${pct === 100 ? 'bg-success' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
        </div>
        {/* troca rápida entre treinos sem voltar à tela inicial */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-card p-1" role="tablist" aria-label="Escolher treino">
          {['A', 'B', 'C'].map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={t === treino}
              onClick={() => onSwitch(t)}
              className={`relative h-9 rounded-lg text-sm font-bold transition-colors ${t === treino ? 'bg-line text-white' : 'text-muted'}`}
            >
              Treino {t}
              {t === proximo && t !== treino && <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" aria-label="próximo" />}
            </button>
          ))}
        </div>
      </div>

      {proximo === treino && feitas === 0 && (
        <p className="flex items-center gap-2 text-sm font-semibold text-accent">
          <Sparkles size={16} aria-hidden="true" /> Este é o seu próximo treino.
        </p>
      )}

      <div className="space-y-3">
        {slots.map(({ slotId, ex, extra }, i) => (
          <ExerciseCard
            key={slotId}
            ex={ex}
            slotId={slotId}
            treino={treino}
            ordem={i + 1}
            extra={extra}
            onOpen={(e, sid, swap) => onOpen(extra ? { ex: e } : { ex: e, slotId: sid, treino, swap })}
            onRemove={(e) => { dispatch({ type: 'removeExtra', treino, id: e.id }); onToast(`${e.nome} removido do Treino ${treino}.`); }}
          />
        ))}
      </div>

      <button type="button" onClick={onAddExercise} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-accent active:bg-accent/10">
        <Plus size={18} aria-hidden="true" /> Adicionar exercício
      </button>

      <button type="button" onClick={finalizar} className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-black ${pct === 100 ? 'bg-success text-bg' : 'border border-line bg-card text-white'}`}>
        <Flag size={20} aria-hidden="true" /> Finalizar treino
      </button>
    </div>
  );
}
