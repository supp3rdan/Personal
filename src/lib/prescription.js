// Ajuste de volume por nível; o valor base do JSON é o Intermediário.
export function prescribe(ex, nivel) {
  const p = ex.prescricao;
  const segundos = p.unidade === 's';
  const out = { ...p };

  if (nivel === 'iniciante') {
    out.series = Math.max(2, p.series - 1);
    if (!segundos) { out.repsMin = 12; out.repsMax = 15; }
    else { out.repsMin = Math.max(15, p.repsMin - 10); out.repsMax = Math.max(20, p.repsMax - 15); }
  } else if (nivel === 'avancado') {
    if (ex.tipo === 'multiarticular') {
      out.series = p.series + 1;
      out.repsMin = 6;
      out.repsMax = 10;
    } else if (segundos) {
      out.repsMin = p.repsMin + 15;
      out.repsMax = p.repsMax + 15;
    }
  }
  return out;
}

export const repsLabel = (p) => `${p.repsMin}–${p.repsMax}${p.unidade === 's' ? ' s' : ' reps'}`;
