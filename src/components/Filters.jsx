import { Search, X } from 'lucide-react';
import { EQUIPAMENTOS, EQUIP_FILTRO, GRUPOS_FILTRO, GRUPOS_SECUNDARIOS, MUSCULOS, grupoDe } from '../lib/labels.js';
import { normalize } from '../lib/text.js';

export const FILTROS_VAZIOS = { busca: '', grupos: [], equip: [] };

export const temFiltro = (f) => !!(f.busca.trim() || f.grupos.length || f.equip.length);

/** Combina busca (sem acento) + grupos (OU entre si) + equipamentos (OU entre si). */
export function aplicarFiltros(lista, f, buscaDebounced) {
  const q = normalize(buscaDebounced ?? f.busca);
  return lista.filter((item) => {
    const ex = item.ex || item;
    if (q && !normalize(ex.nome).includes(q)) return false;
    if (f.grupos.length) {
      const sec = (ex.musculosSecundarios || []).map(grupoDe);
      const principal = f.grupos.includes(grupoDe(ex.musculoPrincipal));
      const porSecundario = f.grupos.some((g) => GRUPOS_SECUNDARIOS.includes(g) && sec.includes(g));
      if (!principal && !porSecundario) return false;
    }
    if (f.equip.length && !f.equip.includes(ex.equipamento)) return false;
    return true;
  });
}

function Chip({ ativo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
        ativo ? 'border-accent bg-accent text-bg' : 'border-line bg-card text-white active:border-accent'
      }`}
    >
      {children}
    </button>
  );
}

export default function Filters({ value, onChange, total, mostrados }) {
  const toggle = (campo, v) =>
    onChange({ ...value, [campo]: value[campo].includes(v) ? value[campo].filter((x) => x !== v) : [...value[campo], v] });

  return (
    <div className="space-y-2">
      <label className="relative block">
        <span className="sr-only">Buscar exercício por nome</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} aria-hidden="true" />
        <input
          type="search"
          value={value.busca}
          onChange={(e) => onChange({ ...value, busca: e.target.value })}
          placeholder="Buscar exercício…"
          className="h-12 w-full rounded-xl border border-line bg-card pl-10 pr-11 text-base text-white placeholder:text-muted focus:border-accent focus:outline-none"
        />
        {value.busca && (
          <button type="button" onClick={() => onChange({ ...value, busca: '' })} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-muted" aria-label="Limpar busca">
            <X size={18} />
          </button>
        )}
      </label>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filtrar por grupo muscular">
        {GRUPOS_FILTRO.map((g) => (
          <Chip key={g} ativo={value.grupos.includes(g)} onClick={() => toggle('grupos', g)}>{MUSCULOS[g]}</Chip>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filtrar por equipamento">
        {EQUIP_FILTRO.map((e) => (
          <Chip key={e} ativo={value.equip.includes(e)} onClick={() => toggle('equip', e)}>{EQUIPAMENTOS[e]}</Chip>
        ))}
      </div>

      <div className="flex h-8 items-center justify-between text-sm">
        <span className="text-muted" aria-live="polite">
          {temFiltro(value) ? `${mostrados} de ${total} exercícios` : `${total} exercícios`}
        </span>
        {temFiltro(value) && (
          <button type="button" onClick={() => onChange(FILTROS_VAZIOS)} className="h-8 px-2 font-semibold text-accent">
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
