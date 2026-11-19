# Personal — Treino ABC

App web (PWA) para gerenciar e executar um **Treino ABC de musculação** com perfis **Masculino** e **Feminino**. Feito para usar com uma mão na academia: dark mode, botões grandes e funcionamento 100% offline.

## Funcionalidades

- **Perfis Masculino/Feminino** com divisões A/B/C diferentes e cor de destaque própria (ciano / coral).
- **Nível de experiência** (Iniciante, Intermediário, Avançado) ajusta séries e repetições automaticamente.
- **Cards de exercício** com músculos, prescrição (séries × reps, descanso), cadência e dica de segurança.
- **Checklist de séries** com barra de progresso do treino.
- **Timer de descanso** flutuante (45/60/90/120 s, +15 s, pausar), que inicia sozinho ao marcar uma série e avisa com som, vibração e flash. O tempo é calculado por horário, então continua certo com o app em segundo plano.
- **Registro de carga e repetições** salvo automaticamente, com "Última vez: 20 kg × 10".
- **Trocar exercício** por uma alternativa (aparelho ocupado), com opção de restaurar o original.
- **Adicionar exercícios ao treino**: qualquer exercício da Biblioteca pode entrar no Treino A, B ou C como extra (e ser removido depois).
- **Filtros combinados**: 14 grupos musculares (incluindo trapézio, antebraço, lombar e adutores), equipamento e busca por nome sem acento.
- **Biblioteca**: 139 exercícios do app em português + ~600 do free-exercise-db quando houver internet.
- **Histórico** de treinos, sugestão do próximo treino (A→B→C), exportar/importar backup em JSON.
- Mantém a tela ligada durante o treino (Wake Lock API, quando suportada).

## Rodar

```bash
npm install
npm run dev       # desenvolvimento
npm run build     # gera a pasta dist/
npm run preview   # serve o build (o service worker só roda no build)
```

## Publicação

O app é publicado no GitHub Pages a cada push na `main` (workflow em `.github/workflows/deploy.yml`):
https://supp3rdan.github.io/Personal/

## Estrutura

```
src/
  data/exercises.json      catálogo local (fonte da verdade, funciona offline)
  data/workouts.js         divisões A/B/C por perfil
  services/media.js        todo acesso a APIs externas (trocar de API = mexer só aqui)
  state/store.jsx          estado global (useReducer + Context) e persistência no localStorage
  state/timer.jsx          timer de descanso
  lib/                     prescrição por nível, rótulos/traduções, hooks
  components/              telas e componentes
public/sw.js               service worker (offline + cache de imagens)
docs/PROMPT.md             especificação usada para construir o app
```

## Mídia

1. **free-exercise-db** (domínio público): imagens de início/fim alternando a cada 1 s.
2. **ExerciseDB V1** (opcional, desligável nos ajustes): tenta um GIF animado na tela de detalhes.
3. **Placeholder local** quando não há internet.

Requisições com timeout, catálogo em cache por 7 dias e imagens guardadas pelo service worker depois da primeira visualização.

## Dados salvos

Tudo fica no `localStorage` do navegador, com chaves `abc:v1:*` e versão de esquema em `abc:schema`. Use **Ajustes → Exportar** para fazer backup.

> Este app não substitui a orientação de um profissional de Educação Física.
