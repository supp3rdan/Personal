// Todo acesso externo fica aqui. Trocar de API = mexer só neste arquivo.
import { MUSCULO_EN, EQUIP_EN, NIVEL_EN } from '../lib/labels.js';

const FEDB_JSON = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const FEDB_IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const EXDB_SEARCH = 'https://oss.exercisedb.dev/api/v1/exercises/search';

const TIMEOUT_MS = 4000; // por requisição de API
const CATALOG_TIMEOUT_MS = 10000; // o catálogo completo tem ~1 MB, então ganha mais folga
const CATALOG_KEY = 'abc:v1:catalogo';
const GIF_KEY = 'abc:v1:gifs';
const WEEK = 7 * 24 * 60 * 60 * 1000;

let memoryCatalog = null; // usado se o localStorage estiver cheio

async function fetchJson(url, timeout = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const readJson = (key) => {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
};
const writeJson = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
};

/** Frames (início/fim) do free-exercise-db. Não precisa de rede para montar a URL. */
export const fedbFrames = (fedbId) => (fedbId ? [`${FEDB_IMG}${fedbId}/0.jpg`, `${FEDB_IMG}${fedbId}/1.jpg`] : []);

/** GIF da ExerciseDB V1 (opcional). Resolve null em qualquer falha. */
export async function findGif(name) {
  if (!name) return null;
  const cache = readJson(GIF_KEY) || {};
  const hit = cache[name];
  if (hit && Date.now() - hit.t < WEEK) return hit.url;
  try {
    const json = await fetchJson(`${EXDB_SEARCH}?q=${encodeURIComponent(name)}&limit=1`);
    const list = Array.isArray(json) ? json : json?.data || json?.exercises || [];
    const url = list[0]?.gifUrl || null;
    cache[name] = { url, t: Date.now() };
    writeJson(GIF_KEY, cache);
    return url;
  } catch {
    return null;
  }
}

// Converte um item do free-exercise-db para o formato do app (em português)
function fromFedb(e) {
  const musculos = (e.primaryMuscles || []).map((m) => MUSCULO_EN[m] || m);
  const isComposto = e.mechanic === 'compound';
  return {
    id: `fedb:${e.id}`,
    nome: e.name,
    musculoPrincipal: musculos[0] || 'abdomen',
    musculosSecundarios: (e.secondaryMuscles || []).map((m) => MUSCULO_EN[m] || m),
    equipamento: EQUIP_EN[e.equipment] || 'outro',
    tipo: isComposto ? 'multiarticular' : 'isolador',
    prescricao: isComposto
      ? { series: 3, repsMin: 8, repsMax: 12, descansoSeg: 90 }
      : { series: 3, repsMin: 10, repsMax: 15, descansoSeg: 60 },
    cadencia: '2-0-2 — movimento controlado',
    passos: e.instructions || [],
    passosIdioma: 'en',
    dicaSeguranca: 'Use uma carga que permita técnica perfeita em todas as repetições. Na dúvida, peça ajuda a um profissional.',
    alternativas: [],
    nivelOrigem: NIVEL_EN[e.level] || null,
    origem: 'api',
    apiRefs: { freeExerciseDb: e.id, exerciseDbName: e.name.toLowerCase() },
  };
}

const CATEGORIAS = new Set(['strength', 'powerlifting', 'olympic weightlifting', 'strongman']);

/**
 * Catálogo ampliado para a Biblioteca.
 * Retorna { itens, fonte: 'cache' | 'api' | 'offline' }.
 */
export async function loadCatalog() {
  if (memoryCatalog) return { itens: memoryCatalog, fonte: 'cache' };
  const cached = readJson(CATALOG_KEY);
  if (cached && Date.now() - cached.t < WEEK) {
    memoryCatalog = cached.itens;
    return { itens: cached.itens, fonte: 'cache' };
  }
  try {
    const raw = await fetchJson(FEDB_JSON, CATALOG_TIMEOUT_MS);
    const itens = raw.filter((e) => CATEGORIAS.has(e.category)).map(fromFedb);
    memoryCatalog = itens;
    writeJson(CATALOG_KEY, { t: Date.now(), itens });
    return { itens, fonte: 'api' };
  } catch {
    // cache vencido ainda é melhor que nada
    if (cached?.itens) return { itens: cached.itens, fonte: 'cache' };
    return { itens: [], fonte: 'offline' };
  }
}
