import { useCallback, useEffect, useRef, useState } from 'react';
import { Dumbbell, History, Library, Settings } from 'lucide-react';
import HomeView from './components/HomeView.jsx';
import WorkoutView from './components/WorkoutView.jsx';
import LibraryView from './components/LibraryView.jsx';
import HistoryView from './components/HistoryView.jsx';
import DetailModal from './components/DetailModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import RestTimer from './components/RestTimer.jsx';
import { FILTROS_VAZIOS } from './components/Filters.jsx';
import { useStore } from './state/store.jsx';
import { useBackClose } from './lib/hooks.js';

const NAV_KEY = 'abc:v1:nav';
const TELAS = ['inicio', 'treino', 'biblioteca', 'historico'];

function lerNav() {
  try {
    const n = JSON.parse(localStorage.getItem(NAV_KEY));
    if (n && TELAS.includes(n.tela) && ['A', 'B', 'C'].includes(n.treino)) return n;
  } catch { /* */ }
  return { tela: 'inicio', treino: 'A' };
}

const NAV = [
  { id: 'inicio', label: 'Treinos', Icon: Dumbbell },
  { id: 'biblioteca', label: 'Biblioteca', Icon: Library },
  { id: 'historico', label: 'Histórico', Icon: History },
];

export default function App() {
  const { state, dispatch } = useStore();
  const [nav, setNav] = useState(lerNav);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [detalhe, setDetalhe] = useState(null);
  const [ajustes, setAjustes] = useState(false);
  const [toast, setToast] = useState(null);
  const headerRef = useRef(null);
  const toastTimer = useRef(null);
  const { tela, treino } = nav;

  useEffect(() => { try { localStorage.setItem(NAV_KEY, JSON.stringify(nav)); } catch { /* */ } }, [nav]);

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
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const irPara = (novaTela, novoTreino) => {
    if (novaTela !== tela) setFiltros(FILTROS_VAZIOS);
    setNav((n) => ({ tela: novaTela, treino: novoTreino || n.treino }));
    window.scrollTo({ top: 0 });
  };

  const voltarInicio = () => irPara('inicio');
  // "voltar" do celular dentro de um treino leva para a lista de treinos
  useBackClose(tela === 'treino', voltarInicio);

  const trocarPerfil = (perfil) => {
    if (perfil === state.perfil) return;
    dispatch({ type: 'perfil', value: perfil });
    setFiltros(FILTROS_VAZIOS);
  };

  const closeDetalhe = useCallback(() => setDetalhe(null), []);
  const closeAjustes = useCallback(() => setAjustes(false), []);
  const navAtiva = tela === 'treino' ? 'inicio' : tela;

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <header ref={headerRef} className="sticky top-0 z-30 bg-bg/95 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-black tracking-tight text-white">
            Treino <span className="text-accent">ABC</span>
          </h1>
          <div className="ml-auto flex rounded-full bg-card p-1" role="radiogroup" aria-label="Perfil de treino">
            {[['masculino', 'Masc.', 'Masculino'], ['feminino', 'Fem.', 'Feminino']].map(([v, curto, longo]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={state.perfil === v}
                aria-label={longo}
                onClick={() => trocarPerfil(v)}
                className={`h-9 rounded-full px-3.5 text-sm font-bold transition-colors ${state.perfil === v ? 'bg-accent text-bg' : 'text-muted'}`}
              >
                {curto}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setAjustes(true)} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-line" aria-label="Ajustes">
            <Settings size={21} />
          </button>
        </div>
      </header>

      <main className="px-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        {tela === 'inicio' && <HomeView onStart={(t) => irPara('treino', t)} />}
        {tela === 'treino' && (
          <WorkoutView
            key={`${state.perfil}-${treino}`}
            treino={treino}
            onBack={voltarInicio}
            onSwitch={(t) => setNav((n) => ({ ...n, treino: t }))}
            onOpen={setDetalhe}
            onToast={showToast}
            onAddExercise={() => { irPara('biblioteca'); showToast(`Abra um exercício e toque em "Treino ${treino}" para adicionar.`); }}
          />
        )}
        {tela === 'biblioteca' && <LibraryView filtros={filtros} setFiltros={setFiltros} onOpen={setDetalhe} />}
        {tela === 'historico' && <HistoryView />}

        <p className="mt-10 text-center text-xs text-muted/70">
          Este app não substitui a orientação de um profissional de Educação Física.
        </p>
      </main>

      <RestTimer />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Navegação principal">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {NAV.map(({ id, label, Icon }) => {
            const ativo = navAtiva === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => irPara(id)}
                aria-current={ativo ? 'page' : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${ativo ? 'text-accent' : 'text-muted'}`}
              >
                <Icon size={22} strokeWidth={ativo ? 2.5 : 2} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <DetailModal item={detalhe} onClose={closeDetalhe} onToast={showToast} />
      <SettingsModal open={ajustes} onClose={closeAjustes} onToast={showToast} />

      {toast && (
        <div role="status" className="fixed inset-x-4 top-[calc(var(--header-h,4rem)+0.5rem)] z-[70] mx-auto max-w-md rounded-xl border border-line bg-card px-4 py-3 text-center text-sm font-semibold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
