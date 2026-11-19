import { CalendarCheck } from 'lucide-react';
import { useStore } from '../state/store.jsx';
import { WORKOUTS } from '../data/workouts.js';

const fmt = (iso) => {
  const t = new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export default function HistoryView() {
  const { state } = useStore();
  const sessoes = state.historico;
  const seteDias = Date.now() - 7 * 864e5;
  const naSemana = sessoes.filter((h) => new Date(h.data).getTime() >= seteDias).length;

  return (
    <div className="space-y-4 pt-4">
      <div>
        <h2 className="text-2xl font-black text-white">Histórico</h2>
        <p className="text-sm text-muted">{naSemana} {naSemana === 1 ? 'treino' : 'treinos'} nos últimos 7 dias · {sessoes.length} no total</p>
      </div>

      {sessoes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line p-8 text-center">
          <CalendarCheck className="text-muted" size={32} aria-hidden="true" />
          <p className="text-muted">Quando você finalizar um treino, ele aparece aqui com as cargas usadas.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessoes.slice(0, 50).map((h) => {
            const feitos = h.itens.filter((i) => i.series > 0);
            const nome = WORKOUTS[h.perfil]?.[h.treino]?.nome;
            return (
              <li key={h.data} className="rounded-2xl border border-line bg-card p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-line text-lg font-black text-white">{h.treino}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{nome || `Treino ${h.treino}`}</p>
                    <p className="text-xs text-muted">{fmt(h.data)} · {feitos.length} exercícios</p>
                  </div>
                </div>
                {feitos.some((i) => i.kg) && (
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {feitos.filter((i) => i.kg).map((i) => `${i.nome} ${i.kg} kg`).join(' · ')}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
