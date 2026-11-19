export const MUSCULOS = {
  peito: 'Peito',
  costas: 'Costas',
  quadriceps: 'Quadríceps',
  posteriores: 'Posteriores',
  gluteos: 'Glúteos',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abdomen: 'Abdômen',
  panturrilhas: 'Panturrilhas',
  trapezio: 'Trapézio',
  antebraco: 'Antebraço',
  abdutores: 'Abdutores',
  adutores: 'Adutores',
  lombar: 'Lombar',
  pescoco: 'Pescoço',
  obliquos: 'Oblíquos',
};

// Grupos exibidos no filtro; músculos menores caem no grupo mais próximo
export const GRUPOS_FILTRO = ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'antebraco', 'trapezio', 'abdomen', 'lombar', 'quadriceps', 'posteriores', 'gluteos', 'adutores', 'panturrilhas'];
const GRUPO_DE = { abdutores: 'gluteos', obliquos: 'abdomen', pescoco: 'ombros' };
// grupos que raramente são o músculo principal: também aparecem quando são secundários
export const GRUPOS_SECUNDARIOS = ['gluteos', 'abdomen', 'trapezio', 'antebraco', 'lombar', 'adutores'];
export const grupoDe = (m) => GRUPO_DE[m] || m;

export const EQUIPAMENTOS = {
  barra: 'Barra',
  halteres: 'Halteres',
  maquina: 'Máquinas/Polias',
  'peso-corporal': 'Peso Corporal',
  outro: 'Outros',
};
export const EQUIP_FILTRO = ['barra', 'halteres', 'maquina', 'peso-corporal'];

export const NIVEIS = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };

// Tradução EN -> PT do free-exercise-db
export const MUSCULO_EN = {
  chest: 'peito', lats: 'costas', 'middle back': 'costas', 'lower back': 'lombar', traps: 'trapezio',
  quadriceps: 'quadriceps', hamstrings: 'posteriores', glutes: 'gluteos', calves: 'panturrilhas',
  shoulders: 'ombros', biceps: 'biceps', triceps: 'triceps', abdominals: 'abdomen', forearms: 'antebraco',
  abductors: 'abdutores', adductors: 'adutores', neck: 'pescoco',
};
export const EQUIP_EN = {
  barbell: 'barra', 'e-z curl bar': 'barra', dumbbell: 'halteres', kettlebells: 'halteres',
  cable: 'maquina', machine: 'maquina', 'body only': 'peso-corporal',
};
export const NIVEL_EN = { beginner: 'Iniciante', intermediate: 'Intermediário', expert: 'Avançado' };
