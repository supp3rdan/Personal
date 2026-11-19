import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import EXERCISES from '../data/exercises.json';
import { WORKOUTS, NEXT } from '../data/workouts.js';

export const SCHEMA = 1;
const P = 'abc:v1:';
const KEYS = ['perfil', 'nivel', 'trocas', 'extras', 'exCache', 'cargas', 'checks', 'historico', 'config', 'proximo'];

export const BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
export { EXERCISES };

const DEFAULTS = {
  perfil: 'masculino',
  nivel: 'intermediario',
  trocas: {}, // { perfil: { treino: { idOriginal: idNovo } } }
  extras: {}, // { perfil: { treino: [exId] } } exercícios adicionados pelo usuário
  exCache: {}, // { exId: ex } cópia dos exercícios da API adicionados (para funcionar offline)
  cargas: {}, // { exId: { atual: {kg, reps}, ultima: {kg, reps, data} } }
  checks: {}, // { perfil: { treino: { exId: [bool...] } } }
  historico: [], // [{ data, perfil, treino, itens: [...] }]
  config: { autoDescanso: true, gifs: true, som: true, vibrar: true },
  proximo: {}, // { perfil: 'A' | 'B' | 'C' }
};

const read = (k) => {
  try {
    const v = localStorage.getItem(P + k);
    return v == null ? undefined : JSON.parse(v);
  } catch {
    return undefined;
  }
};

// Migração simples: hoje só existe a v1. Novas versões entram aqui em sequência.
function migrate() {
  try {
    const v = Number(localStorage.getItem('abc:schema') || 0);
    if (v < 1) {
      // v0 -> v1: nada a converter, só marca a versão
    }
    localStorage.setItem('abc:schema', String(SCHEMA));
  } catch { /* storage indisponível: app segue em memória */ }
}

function init() {
  migrate();
  const s = {};
  for (const k of KEYS) {
    const v = read(k);
    s[k] = v === undefined ? DEFAULTS[k] : v;
  }
  s.config = { ...DEFAULTS.config, ...s.config };
  if (!['masculino', 'feminino'].includes(s.perfil)) s.perfil = DEFAULTS.perfil;
  if (!['iniciante', 'intermediario', 'avancado'].includes(s.nivel)) s.nivel = DEFAULTS.nivel;
  return s;
}

const setIn = (obj, path, value) => {
  const [head, ...rest] = path;
  return { ...obj, [head]: rest.length ? setIn(obj?.[head] || {}, rest, value) : value };
};

function reducer(s, a) {
  switch (a.type) {
    case 'perfil': return { ...s, perfil: a.value };
    case 'nivel': return { ...s, nivel: a.value };
    case 'config': return { ...s, config: { ...s.config, ...a.value } };

    case 'toggleSerie': {
      const { treino, exId, idx, total } = a;
      const atual = s.checks?.[s.perfil]?.[treino]?.[exId] || [];
      const lista = Array.from({ length: total }, (_, i) => !!atual[i]);
      lista[idx] = !lista[idx];
      return { ...s, checks: setIn(s.checks, [s.perfil, treino, exId], lista) };
    }

    case 'carga': {
      const prev = s.cargas[a.exId]?.atual || {};
      return { ...s, cargas: setIn(s.cargas, [a.exId, 'atual'], { ...prev, ...a.value }) };
    }

    case 'trocar': {
      const { treino, slotId, novoId } = a;
      const mapa = { ...(s.trocas?.[s.perfil]?.[treino] || {}) };
      if (novoId === slotId) delete mapa[slotId];
      else mapa[slotId] = novoId;
      // limpa o checklist do exercício que saiu
      const checks = setIn(s.checks, [s.perfil, treino], { ...(s.checks?.[s.perfil]?.[treino] || {}) });
      return { ...s, trocas: setIn(s.trocas, [s.perfil, treino], mapa), checks };
    }

    case 'addExtra': {
      const { treino, ex } = a;
      const lista = s.extras?.[s.perfil]?.[treino] || [];
      if (lista.includes(ex.id)) return s;
      const exCache = BY_ID[ex.id] ? s.exCache : { ...s.exCache, [ex.id]: ex };
      return { ...s, exCache, extras: setIn(s.extras, [s.perfil, treino], [...lista, ex.id]) };
    }

    case 'removeExtra': {
      const lista = (s.extras?.[s.perfil]?.[a.treino] || []).filter((id) => id !== a.id);
      return { ...s, extras: setIn(s.extras, [s.perfil, a.treino], lista) };
    }

    case 'finalizar': {
      const { treino, itens } = a;
      const data = new Date().toISOString();
      let cargas = s.cargas;
      for (const it of itens) {
        const at = s.cargas[it.id]?.atual;
        if (at && (at.kg || at.reps)) {
          cargas = setIn(cargas, [it.id], { ultima: { kg: at.kg ?? null, reps: at.reps ?? null, data } });
        }
      }
      const sessao = { data, perfil: s.perfil, treino, itens };
      return {
        ...s,
        cargas,
        historico: [sessao, ...s.historico].slice(0, 200),
        checks: setIn(s.checks, [s.perfil, treino], {}),
        proximo: { ...s.proximo, [s.perfil]: NEXT[treino] },
      };
    }

    case 'importar': {
      const d = a.data || {};
      const s2 = { ...s };
      for (const k of KEYS) if (d[k] !== undefined) s2[k] = d[k];
      s2.config = { ...DEFAULTS.config, ...s2.config };
      return s2;
    }

    case 'resetar': return { ...DEFAULTS };
    default: return s;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    for (const k of KEYS) {
      try { localStorage.setItem(P + k, JSON.stringify(state[k])); } catch { /* cheio ou bloqueado */ }
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.perfil = state.perfil;
  }, [state.perfil]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

/** Lista de exercícios do treino com trocas aplicadas: [{ slotId, ex }] */
export function workoutSlots(state, treino) {
  const base = WORKOUTS[state.perfil][treino].exercicios;
  const trocas = state.trocas?.[state.perfil]?.[treino] || {};
  const principais = base.map((slotId) => ({ slotId, ex: BY_ID[trocas[slotId]] || BY_ID[slotId] }));
  const extras = (state.extras?.[state.perfil]?.[treino] || [])
    .map((id) => ({ slotId: `extra:${id}`, ex: BY_ID[id] || state.exCache?.[id], extra: true }))
    .filter((s) => s.ex);
  return [...principais, ...extras];
}

/** Treinos (A/B/C) do perfil atual em que o exercício já está. */
export function treinosCom(state, exId) {
  return ['A', 'B', 'C'].filter((t) => workoutSlots(state, t).some((s) => s.ex.id === exId));
}

export function exportData(state) {
  const data = Object.fromEntries(KEYS.map((k) => [k, state[k]]));
  return { app: 'treino-abc', schema: SCHEMA, exportadoEm: new Date().toISOString(), data };
}
