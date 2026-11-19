import { useRef } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import Modal from './Modal.jsx';
import { exportData, useStore } from '../state/store.jsx';
import { formatDate } from '../lib/text.js';

function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="flex min-h-[3.5rem] cursor-pointer items-center justify-between gap-3 border-b border-line py-2">
      <span>
        <span className="block font-semibold text-white">{label}</span>
        {desc && <span className="block text-xs text-muted">{desc}</span>}
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-8 w-14 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-6 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent" aria-hidden="true" />
    </label>
  );
}

export default function SettingsModal({ open, onClose, onToast }) {
  const { state, dispatch } = useStore();
  const fileRef = useRef(null);
  const cfg = state.config;
  const set = (value) => dispatch({ type: 'config', value });

  const exportar = () => {
    const blob = new Blob([JSON.stringify(exportData(state), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treino-abc-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onToast('Backup exportado.');
  };

  const importar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (json.app !== 'treino-abc' || !json.data) throw new Error('formato');
      dispatch({ type: 'importar', data: json.data });
      onToast('Backup importado com sucesso.');
      onClose();
    } catch {
      onToast('Arquivo inválido: use um backup exportado por este app.');
    }
  };

  const resetar = () => {
    if (!window.confirm('Apagar perfil, cargas, histórico e trocas de exercícios? Isso não pode ser desfeito.')) return;
    dispatch({ type: 'resetar' });
    onToast('Dados apagados.');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajustes e histórico" labelledBy="settings-title">
      <Toggle label="Descanso automático" desc="Inicia o timer ao marcar uma série" checked={cfg.autoDescanso} onChange={(v) => set({ autoDescanso: v })} />
      <Toggle label="Som ao fim do descanso" checked={cfg.som} onChange={(v) => set({ som: v })} />
      <Toggle label="Vibração" desc="Em celulares compatíveis" checked={cfg.vibrar} onChange={(v) => set({ vibrar: v })} />
      <Toggle label="GIFs da ExerciseDB" desc="Tenta carregar GIF animado nos detalhes (precisa de internet)" checked={cfg.gifs} onChange={(v) => set({ gifs: v })} />

      <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-muted">Histórico</h3>
      {state.historico.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Nenhum treino finalizado ainda.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {state.historico.slice(0, 15).map((h) => (
            <li key={h.data} className="rounded-xl bg-bg p-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-white">Treino {h.treino} · {h.perfil === 'masculino' ? 'Masc.' : 'Fem.'}</span>
                <span className="text-muted">{formatDate(h.data)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {h.itens.filter((i) => i.series > 0).map((i) => `${i.nome}${i.kg ? ` ${i.kg}kg` : ''}`).join(' · ') || 'Sem séries registradas'}
              </p>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-muted">Dados</h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={exportar} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-line font-semibold text-white"><Download size={18} /> Exportar</button>
        <button type="button" onClick={() => fileRef.current?.click()} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-line font-semibold text-white"><Upload size={18} /> Importar</button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importar} />
      <button type="button" onClick={resetar} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 font-semibold text-red-300"><Trash2 size={18} /> Resetar dados</button>

      <p className="mt-5 text-center text-xs text-muted">
        Mídia: free-exercise-db (domínio público) e ExerciseDB. Este app não substitui a orientação de um profissional de Educação Física.
      </p>
    </Modal>
  );
}
