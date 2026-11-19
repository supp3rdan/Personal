import { ChevronRight, Clock } from 'lucide-react';
import { useStore, workoutStats } from '../state/store.jsx';
import { WORKOUTS } from '../data/workouts.js';
import { NIVEIS } from '../lib/labels.js';
import { prescribe } from '../lib/prescription.js';
import { formatDate } from '../lib/text.js';

function WorkoutCard({ treino, onStart }) {
  const { state } = useStore();
  const info = WORKOUTS[state.perfil][treino];
  const st = workoutStats(state, treino, prescribe);
  const proximo = (state.proximo?.[state.perfil] || 'A') === treino;
  const emAndamento = st.feitas > 0;

  let status = st.ultimaData ? `Último: ${formatDate(st.ultimaData)}` : 'Ainda não feito';
  if (emAndamento) status = `Em andamento · ${st.pct}%`;

  return (
    <button
      type="button"
      onClick={() => onStart(treino)}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors active:bg-line ${
        proximo ? 'border-accent/60 bg-accent/5' : 'border-line bg-card'
      }`}
      aria-label={`Abrir Treino ${treino}: ${info.nome}`}
    >
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl font-black ${proximo ? 'bg-accent text-bg' : 'bg-line text-white'}`}>
        {treino}
      </span>
      <span className="min-w-0 flex-1">
        {proximo && <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-accent">Próximo treino</span>}
        <span className="block text-lg font-bold leading-tight text-white">{info.nome}</span>
        <span className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          {st.exercicios} exercícios · <Clock size={13} aria-hidden="true" /> ~{st.minutos} min
        </span>
        <span className={`mt-0.5 block text-xs ${emAndamento ? 'font-semibold text-success' : 'text-muted'}`}>{status}</span>
        {emAndamento && (
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span className="block h-full rounded-full bg-success" style={{ width: `${st.pct}%` }} />
          </span>
        )}
      </span>
      <ChevronRight className="shrink-0 text-muted" size={22} aria-hidden="true" />
    </button>
  );
}

export default function HomeView({ onStart }) {
  const { state, dispatch } = useStore();
  return (
    <div className="space-y-4 pt-4">
      <div>
        <h2 className="text-2xl font-black text-white">Seus treinos</h2>
        <p className="text-sm text-muted">Siga a sequência A → B → C e recomece.</p>
      </div>

      <div className="space-y-3">
        {['A', 'B', 'C'].map((t) => <WorkoutCard key={t} treino={t} onStart={onStart} />)}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted">Nível</h3>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-card p-1" role="radiogroup" aria-label="Nível de experiência">
          {Object.entries(NIVEIS).map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={state.nivel === v}
              onClick={() => dispatch({ type: 'nivel', value: v })}
              className={`h-11 rounded-lg text-sm font-semibold transition-colors ${state.nivel === v ? 'bg-accent text-bg' : 'text-muted'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">O nível ajusta séries e repetições de todos os exercícios.</p>
      </div>
    </div>
  );
}
