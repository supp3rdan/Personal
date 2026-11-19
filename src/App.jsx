import { useCallback, useEffect, useRef, useState } from 'react';
import { Library, Settings } from 'lucide-react';
import WorkoutView from './components/WorkoutView.jsx';
import LibraryView from './components/LibraryView.jsx';
import DetailModal from './components/DetailModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import RestTimer from './components/RestTimer.jsx';
import { FILTROS_VAZIOS } from './components/Filters.jsx';
import { useStore } from './state/store.jsx';
import { NIVEIS } from './lib/labels.js';

const ABAS = ['A', 'B', 'C', 'biblioteca'];
const ABA_KEY = 'abc:v1:aba';

export default function App() {
  const { state, dispatch } = useStore();
  const [aba, setAba] = useState(() => {
    try { const a = localStorage.getItem(ABA_KEY); if (ABAS.includes(a)) return a; } catch { /* */ }
    return state.proximo?.[state.perfil] || 'A';
  });
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [detalhe, setDetalhe] = useState(null);
  const [ajustes, setAjustes] = useState(false);
  const [toast, setToast] = useState(null);
  const headerRef = useRef(null);

  useEffect(() => { try { localStorage.setItem(ABA_KEY, aba); } catch { /* */ } }, [aba]);

  // altura do header para o cabeçalho do treino grudar logo abaixo
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => setToast(null), 3000);
  }, []);

  const trocarAba = (a) => {
    if (a !== aba) setFiltros(FILTROS_VAZIOS); // filtros da Biblioteca não devem esconder o treino
    setAba(a);
    window.scrollTo({ top: 0 });
  };

  const trocarPerfil = (perfil) => {
    if (perfil === state.perfil) return;
    dispatch({ type: 'perfil', value: perfil });
    setFiltros(FILTROS_VAZIOS);
  };

  const closeDetalhe = useCallback(() => setDetalhe(null), []);
  const closeAjustes = useCallback(() => setAjustes(false), []);

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-line bg-bg/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-black tracking-tight text-white">
            Treino <span className="text-accent">ABC</span>
          </h1>
          <div className="ml-auto flex rounded-full border border-line bg-card p-1" role="radiogroup" aria-label="Perfil de treino">
            {[['masculino', 'Masculino'], ['feminino', 'Feminino']].map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={state.perfil === v}
                onClick={() => trocarPerfil(v)}
                className={`h-10 rounded-full px-3 text-sm font-bold transition-colors ${state.perfil === v ? 'bg-accent text-bg' : 'text-muted'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setAjustes(true)} className="flex h-12 w-12 items-center justify-center rounded-full text-muted active:bg-line" aria-label="Ajustes e histórico">
            <Settings size={22} />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-card p-1" role="radiogroup" aria-label="Nível de experiência">
          {Object.entries(NIVEIS).map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={state.nivel === v}
              onClick={() => dispatch({ type: 'nivel', value: v })}
              className={`h-10 rounded-lg text-sm font-semibold transition-colors ${state.nivel === v ? 'bg-line text-white ring-1 ring-accent' : 'text-muted'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        {aba === 'biblioteca'
          ? <LibraryView filtros={filtros} setFiltros={setFiltros} onOpen={setDetalhe} />
          : <WorkoutView key={`${state.perfil}-${aba}`} treino={aba} filtros={filtros} setFiltros={setFiltros} onOpen={setDetalhe} onToast={showToast} onAddExercise={() => { trocarAba('biblioteca'); showToast(`Abra um exercício e toque em "Treino ${aba}" para adicionar.`); }} />}

        <p className="mt-8 text-center text-xs text-muted">
          Este app não substitui a orientação de um profissional de Educação Física.
        </p>
      </main>

      <RestTimer />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Treinos">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {ABAS.map((a) => {
            const ativo = aba === a;
            const sugerido = state.proximo?.[state.perfil] === a;
            return (
              <button
                key={a}
                type="button"
                onClick={() => trocarAba(a)}
                aria-current={ativo ? 'page' : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${ativo ? 'text-accent' : 'text-muted'}`}
              >
                {a === 'biblioteca'
                  ? <Library size={22} aria-hidden="true" />
                  : <span className={`text-xl font-black leading-none ${ativo ? 'text-accent' : 'text-white'}`}>{a}</span>}
                <span>{a === 'biblioteca' ? 'Biblioteca' : `Treino ${a}`}</span>
                {sugerido && a !== 'biblioteca' && <span className="absolute right-[30%] top-2 h-2 w-2 rounded-full bg-success" aria-label="próximo sugerido" />}
                {ativo && <span className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-accent" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </nav>

      <DetailModal item={detalhe} onClose={closeDetalhe} onToast={showToast} />
      <SettingsModal open={ajustes} onClose={closeAjustes} onToast={showToast} />

      {toast && (
        <div role="status" className="fixed inset-x-4 top-[calc(var(--header-h,6rem)+0.5rem)] z-[70] mx-auto max-w-md rounded-xl border border-line bg-card px-4 py-3 text-center text-sm font-semibold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
