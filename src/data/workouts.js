// Divisões ABC por perfil. A ordem já vai do multiarticular mais pesado ao isolador.
export const WORKOUTS = {
  masculino: {
    A: {
      titulo: 'Push — Empurrar',
      foco: 'Peitoral, deltoide anterior/lateral e tríceps',
      exercicios: ['supino-reto-barra', 'supino-inclinado-halteres', 'desenvolvimento-halteres', 'crossover', 'elevacao-lateral', 'triceps-corda', 'triceps-testa'],
    },
    B: {
      titulo: 'Pull — Puxar',
      foco: 'Dorsais, trapézio, deltoide posterior, bíceps e antebraço',
      exercicios: ['barra-fixa', 'remada-curvada', 'remada-baixa', 'face-pull', 'encolhimento-barra', 'rosca-direta', 'rosca-martelo'],
    },
    C: {
      titulo: 'Legs + Core',
      foco: 'Quadríceps, posteriores, glúteos, panturrilhas e abdômen',
      exercicios: ['agachamento-livre', 'leg-press', 'terra-romeno', 'cadeira-extensora', 'mesa-flexora', 'panturrilha-em-pe', 'elevacao-pernas'],
    },
  },
  feminino: {
    A: {
      titulo: 'Inferiores — Quadríceps e Glúteo',
      foco: 'Agachamento, leg press, extensora, passada e abdutores',
      exercicios: ['agachamento-livre', 'leg-press', 'passada-halteres', 'cadeira-extensora', 'gluteo-quatro-apoios', 'cadeira-abdutora'],
    },
    B: {
      titulo: 'Superiores Completos + Core',
      foco: 'Costas, ombros, peitoral moderado, bíceps, tríceps e abdômen',
      exercicios: ['puxada-frente', 'remada-baixa', 'supino-inclinado-halteres', 'desenvolvimento-halteres', 'rosca-alternada', 'triceps-corda', 'abdominal-crunch'],
    },
    C: {
      titulo: 'Inferiores — Posterior, Glúteo e Panturrilha',
      foco: 'Stiff/terra romeno, elevação pélvica, flexoras e panturrilhas',
      exercicios: ['terra-romeno', 'elevacao-pelvica', 'mesa-flexora', 'avanco-reverso', 'panturrilha-em-pe', 'panturrilha-sentado'],
    },
  },
};

export const NEXT = { A: 'B', B: 'C', C: 'A' };
