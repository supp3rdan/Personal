import { useMemo } from 'react';
import { Flag, Sparkles } from 'lucide-react';
import ExerciseCard from './ExerciseCard.jsx';
import Filters, { aplicarFiltros } from './Filters.jsx';
import { useStore, workoutSlots } from '../state/store.jsx';
import { WORKOUTS } from '../data/workouts.js';
import { prescribe } from '../lib/prescription.js';
import { useDebounce, useWakeLock } from '../lib/hooks.js';

export default function WorkoutView({ treino, filtros, setFiltros, onOpen, onToast }) {
  const { state, dispatch } = useStore();
  const info = WORKOUTS[state.perfil][treino];
  const slots = workoutSlots(state, treino);
  const busca = useDebounce(filtros.busca, 200);
  const visiveis = useMemo(() => aplicarFiltros(slots, filtros, busca), [slots, filtros, busca]);

  const checks = state.checks?.[state.perfil]?.[treino] || {};
  let total = 0;
  let feitas = 0;
  for (const { ex } of slots) {
    const n = prescribe(ex, state.nivel).series;
    total += n;
    feitas += (checks[ex.id] || []).slice(0, n).filter(Boolean).length;
  }
  const pct = total ? Math.round((feitas / total) * 100) : 0;
  const emAndamento = feitas > 0;
  const sugerido = state.proximo?.[state.perfil];

  useWakeLock(emAndamento && pct < 100);

  const finalizar = () => {
    if (feitas === 0) { onToast('Marque pelo menos uma série antes de finalizar.'); return; }
    if (pct < 100 && !window.confirm(`Você fez ${pct}% do treino. Finalizar mesmo assim?`)) return;
    const itens = slots.map(({ ex }) => {
      const n = prescribe(ex, state.nivel).series;
      const at = state.cargas[ex.id]?.atual || {};
      return { id: ex.id, nome: ex.nome, series: (checks[ex.id] || []).slice(0, n).filter(Boolean).length, kg: at.kg ?? null, reps: at.reps ?? null };
    });
    dispatch({ type: 'finalizar', treino, itens });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onToast(`Treino ${treino} salvo no histórico! Próximo: Treino ${{ A: 'B', B: 'C', C: 'A' }[treino]}.`);
  };

  return (
    <div className="space-y-3">
      <div className="sticky top-[var(--header-h)] z-20 -mx-4 border-b border-line bg-bg/95 px-4 pb-3 pt-2 backdrop-blur">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-white">Treino {treino} · {info.titulo}</h2>
            <p className="truncate text-sm text-muted">{info.foco}</p>
          </div>
          <span className="text-2xl font-black tabular-nums text-accent" aria-hidden="true">{pct}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do treino">
          <div className={`h-full rounded-full transition-[width] duration-200 ${pct === 100 ? 'bg-success' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted">{feitas} de {total} séries</p>
      </div>

      {sugerido === treino && !emAndamento && (
        <p className="flex items-center gap-2 rounded-xl bg-accent/10 p-3 text-sm font-semibold text-accent">
          <Sparkles size={18} aria-hidden="true" /> Este é o próximo treino da sua sequência.
        </p>
      )}

      <Filters value={filtros} onChange={setFiltros} total={slots.length} mostrados={visiveis.length} />

      {visiveis.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">
          Nenhum exercício deste treino bate com os filtros. Tente limpar a busca ou procure na aba Biblioteca.
        </p>
      ) : (
        <div className="space-y-3">
          {visiveis.map(({ slotId, ex }) => (
            <ExerciseCard
              key={slotId}
              ex={ex}
              slotId={slotId}
              treino={treino}
              ordem={slots.findIndex((s) => s.slotId === slotId) + 1}
              onOpen={(e, sid, swap) => onOpen({ ex: e, slotId: sid, treino, swap })}
            />
          ))}
        </div>
      )}

      <button type="button" onClick={finalizar} className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-black ${pct === 100 ? 'bg-success text-bg' : 'border border-line bg-card text-white'}`}>
        <Flag size={20} aria-hidden="true" /> Finalizar treino
      </button>
    </div>
  );
}
