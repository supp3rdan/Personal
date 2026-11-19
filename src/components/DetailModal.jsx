import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, Plus, RotateCcw, ShieldAlert } from 'lucide-react';
import Modal from './Modal.jsx';
import ExerciseMedia from './ExerciseMedia.jsx';
import { BY_ID, EXERCISES, treinosCom, useStore } from '../state/store.jsx';
import { EQUIPAMENTOS, MUSCULOS, NIVEIS, grupoDe } from '../lib/labels.js';
import { prescribe, repsLabel } from '../lib/prescription.js';

function alternativasDe(ex) {
  if (ex.alternativas?.length) return ex.alternativas.map((id) => BY_ID[id]).filter(Boolean);
  // exercício da API: sugere os do catálogo local com o mesmo grupo muscular
  const g = grupoDe(ex.musculoPrincipal);
  return EXERCISES.filter((e) => grupoDe(e.musculoPrincipal) === g).slice(0, 4);
}

/**
 * item = { ex, slotId?, treino?, swap? }
 * Com slotId/treino, permite trocar o exercício do treino.
 */
export default function DetailModal({ item, onClose, onToast }) {
  const { state, dispatch } = useStore();
  const [pilha, setPilha] = useState([]);
  const altRef = useRef(null);

  useEffect(() => {
    setPilha(item ? [item.ex] : []);
  }, [item]);

  useEffect(() => {
    if (item?.swap && altRef.current) setTimeout(() => altRef.current?.scrollIntoView({ block: 'start' }), 50);
  }, [item, pilha.length]);

  const ex = pilha[pilha.length - 1];
  if (!item || !ex) return <Modal open={false} onClose={onClose} />;

  const p = prescribe(ex, state.nivel);
  const podeTrocar = item.slotId && item.treino;
  const noTreinoId = podeTrocar ? (state.trocas?.[state.perfil]?.[item.treino]?.[item.slotId] || item.slotId) : null;
  const ehLocal = !!BY_ID[ex.id];
  const alts = alternativasDe(ex).filter((a) => a.id !== ex.id);
  const jaEm = treinosCom(state, ex.id);
  const adicionar = (t) => {
    dispatch({ type: 'addExtra', treino: t, ex });
    onToast(`${ex.nome} adicionado ao Treino ${t}.`);
  };

  const usar = (novo) => {
    dispatch({ type: 'trocar', treino: item.treino, slotId: item.slotId, novoId: novo.id });
    onToast(novo.id === item.slotId ? `Restaurado: ${novo.nome}` : `Treino atualizado: ${novo.nome}`);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={ex.nome}>
      {pilha.length > 1 && (
        <button type="button" onClick={() => setPilha((s) => s.slice(0, -1))} className="mb-2 flex h-10 items-center gap-1 text-sm font-semibold text-accent">
          <ArrowLeft size={16} /> Voltar para {pilha[pilha.length - 2].nome}
        </button>
      )}

      <ExerciseMedia ex={ex} large tryGif={state.config.gifs} className="aspect-[4/3] w-full rounded-2xl" />

      {podeTrocar && ehLocal && ex.id !== noTreinoId && (
        <button type="button" onClick={() => usar(ex)} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-bold text-bg">
          <CheckCircle2 size={20} /> Usar esta no meu treino
        </button>
      )}

      <section className="mt-3 rounded-xl border border-line p-3">
        <h3 className="text-sm font-bold text-white">Adicionar ao treino ({state.perfil === 'masculino' ? 'Masculino' : 'Feminino'})</h3>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {['A', 'B', 'C'].map((t) => {
            const ja = jaEm.includes(t);
            return (
              <button
                key={t}
                type="button"
                disabled={ja}
                onClick={() => adicionar(t)}
                className={`flex h-12 items-center justify-center gap-1 rounded-xl text-sm font-bold ${ja ? 'bg-success/15 text-success' : 'bg-accent/15 text-accent active:bg-accent active:text-bg'}`}
                aria-label={ja ? `Já está no Treino ${t}` : `Adicionar ao Treino ${t}`}
              >
                {ja ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />} Treino {t}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-bg p-2"><div className="text-lg font-bold text-accent">{p.series}</div><div className="text-xs text-muted">séries</div></div>
        <div className="rounded-xl bg-bg p-2"><div className="text-lg font-bold text-accent">{repsLabel(p).replace(' reps', '')}</div><div className="text-xs text-muted">{p.unidade === 's' ? 'segundos' : 'repetições'}</div></div>
        <div className="rounded-xl bg-bg p-2"><div className="text-lg font-bold text-accent">{p.descansoSeg}s</div><div className="text-xs text-muted">descanso</div></div>
      </div>
      <p className="mt-2 text-center text-xs text-muted">Prescrição para o nível {NIVEIS[state.nivel]} · {ex.tipo}</p>

      <section className="mt-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Músculos</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-lg bg-accent px-2 py-1 text-sm font-bold text-bg">{MUSCULOS[ex.musculoPrincipal] || ex.musculoPrincipal}</span>
          {ex.musculosSecundarios.map((m) => (
            <span key={m} className="rounded-lg bg-line px-2 py-1 text-sm text-white">{MUSCULOS[m] || m}</span>
          ))}
          <span className="rounded-lg border border-line px-2 py-1 text-sm text-muted">{EQUIPAMENTOS[ex.equipamento]}</span>
        </div>
      </section>

      <section className="mt-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Cadência</h3>
        <p className="mt-1 text-white">{ex.cadencia}</p>
      </section>

      <section className="mt-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Passo a passo</h3>
        {ex.passosIdioma === 'en' && <p className="mt-1 text-xs text-muted">Instruções originais em inglês (free-exercise-db).</p>}
        <ol className="mt-2 space-y-2">
          {ex.passos.map((passo, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">{i + 1}</span>
              <span className="pt-0.5 leading-snug text-white/90">{passo}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-4 flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
        <ShieldAlert className="shrink-0 text-amber-300" size={20} aria-hidden="true" />
        <p className="text-sm leading-snug text-amber-50"><span className="font-bold">Segurança: </span>{ex.dicaSeguranca}</p>
      </section>

      <section className="mt-5" ref={altRef}>
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">{ehLocal ? 'Alternativas (aparelho ocupado?)' : 'Exercícios equivalentes'}</h3>
        <ul className="mt-2 space-y-2">
          {alts.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl bg-bg p-2">
              <button type="button" onClick={() => setPilha((s) => [...s, a])} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Ver ${a.nome}`}>
                <ExerciseMedia ex={a} className="h-14 w-14 shrink-0 rounded-lg" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-white">{a.nome}</span>
                  <span className="block text-xs text-muted">{EQUIPAMENTOS[a.equipamento]}</span>
                </span>
              </button>
              {podeTrocar && a.id !== noTreinoId && (
                <button type="button" onClick={() => usar(a)} className="h-11 shrink-0 rounded-lg bg-accent/15 px-3 text-sm font-bold text-accent active:bg-accent active:text-bg">
                  Usar
                </button>
              )}
              {podeTrocar && a.id === noTreinoId && <span className="shrink-0 px-2 text-xs font-semibold text-success">No treino</span>}
            </li>
          ))}
        </ul>
        {podeTrocar && noTreinoId !== item.slotId && (
          <button type="button" onClick={() => usar(BY_ID[item.slotId])} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-white">
            <RotateCcw size={16} /> Restaurar original: {BY_ID[item.slotId].nome}
          </button>
        )}
      </section>
    </Modal>
  );
}
