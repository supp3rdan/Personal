import { useEffect, useMemo, useState } from 'react';
import { CloudOff, Globe, Loader2 } from 'lucide-react';
import Filters, { aplicarFiltros } from './Filters.jsx';
import ExerciseMedia from './ExerciseMedia.jsx';
import { EXERCISES, useStore } from '../state/store.jsx';
import { EQUIPAMENTOS, MUSCULOS } from '../lib/labels.js';
import { prescribe, repsLabel } from '../lib/prescription.js';
import { useDebounce } from '../lib/hooks.js';
import { loadCatalog } from '../services/media.js';

const PAGINA = 30;
const LOCAL_FEDB = new Set(EXERCISES.map((e) => e.apiRefs.freeExerciseDb));

export default function LibraryView({ filtros, setFiltros, onOpen }) {
  const { state } = useStore();
  const [remoto, setRemoto] = useState({ itens: [], fonte: 'carregando' });
  const [limite, setLimite] = useState(PAGINA);
  const busca = useDebounce(filtros.busca, 200);

  useEffect(() => {
    let vivo = true;
    loadCatalog().then((r) => { if (vivo) setRemoto(r); });
    return () => { vivo = false; };
  }, []);

  // Local primeiro (em português, com prescrição completa), depois o catálogo da API sem duplicatas
  const todos = useMemo(
    () => [...EXERCISES, ...remoto.itens.filter((e) => !LOCAL_FEDB.has(e.apiRefs.freeExerciseDb))],
    [remoto.itens]
  );
  const filtrados = useMemo(() => aplicarFiltros(todos, filtros, busca), [todos, filtros, busca]);

  useEffect(() => { setLimite(PAGINA); }, [busca, filtros.grupos, filtros.equip]);

  return (
    <div className="space-y-3">
      <div className="pt-2">
        <h2 className="text-xl font-black text-white">Explorar Biblioteca</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          {remoto.fonte === 'carregando' && <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Carregando catálogo online…</>}
          {(remoto.fonte === 'api' || remoto.fonte === 'cache') && <><Globe size={14} aria-hidden="true" /> {EXERCISES.length} exercícios do app + {todos.length - EXERCISES.length} do free-exercise-db</>}
          {remoto.fonte === 'offline' && <><CloudOff size={14} aria-hidden="true" /> Sem conexão: mostrando o catálogo local</>}
        </p>
      </div>

      <Filters value={filtros} onChange={setFiltros} total={todos.length} mostrados={filtrados.length} />

      {filtrados.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">
          Nada encontrado. Confira a grafia ou remova alguns filtros.
          {remoto.fonte !== 'offline' && ' Exercícios do catálogo online estão com nome em inglês (ex.: “squat”, “curl”).'}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtrados.slice(0, limite).map((ex) => {
            const p = prescribe(ex, state.nivel);
            return (
              <li key={ex.id}>
                <button type="button" onClick={() => onOpen({ ex })} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card p-2 text-left active:border-accent">
                  <ExerciseMedia ex={ex} className="h-16 w-16 shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-white">{ex.nome}</span>
                    <span className="block truncate text-xs text-muted">
                      {MUSCULOS[ex.musculoPrincipal] || ex.musculoPrincipal} · {EQUIPAMENTOS[ex.equipamento]}
                    </span>
                    <span className="mt-1 inline-block rounded-md bg-accent/15 px-1.5 py-0.5 text-xs font-bold text-accent">
                      {p.series} × {repsLabel(p)}
                    </span>
                    {ex.origem === 'api' && <span className="ml-1.5 text-[11px] text-muted">online</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {filtrados.length > limite && (
        <button type="button" onClick={() => setLimite((l) => l + PAGINA)} className="h-12 w-full rounded-xl border border-line bg-card font-semibold text-white">
          Carregar mais ({filtrados.length - limite} restantes)
        </button>
      )}
    </div>
  );
}
