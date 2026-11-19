# Prompt — App Web de Treino ABC (Masculino/Feminino)

## Papel
Atue como Desenvolvedor Front-End Sênior com experiência em UX para apps fitness, validando as decisões de treino como um Personal Trainer experiente (CREF). Quando houver conflito entre "bonito" e "usável na academia", priorize o usável.

## Objetivo
Criar um aplicativo web responsivo, **somente front-end**, para gerenciar e executar um **Treino ABC de musculação** com dois perfis (Masculino e Feminino). O app deve funcionar **100% offline** com dados locais e usar APIs públicas apenas para enriquecer mídia e catálogo.

## Stack (obrigatória — não misture alternativas)
- **React 18 + Vite + Tailwind CSS**, JavaScript (sem TypeScript, a menos que eu peça).
- Sem backend, sem chaves de API, sem bibliotecas de UI pesadas. Ícones: `lucide-react`.
- Estado global simples com `useReducer` + Context; persistência em `localStorage`.
- PWA básico (manifest + service worker) para instalar no celular e abrir offline.

## 1. Arquitetura de Treino

Cada treino deve ter **5 a 7 exercícios**, ordenados do multiarticular mais pesado para o isolador, e terminar com core quando aplicável.

**Perfil Masculino (ênfase em tronco superior, com equilíbrio)**
- **A — Push:** Peitoral, Deltoide anterior/lateral, Tríceps.
- **B — Pull:** Dorsais, Trapézio, Deltoide posterior, Bíceps, Antebraço.
- **C — Legs + Core:** Quadríceps, Posteriores de coxa, Glúteos, Panturrilhas, Abdômen.

**Perfil Feminino (ênfase em inferiores e glúteos, com definição superior)**
- **A — Inferiores (quadríceps + glúteo):** Agachamento, Leg Press, Cadeira Extensora, Passada/Afundo, Abdutora.
- **B — Superiores completos + Core:** Costas, Ombros, Peitoral (volume moderado), Bíceps, Tríceps, Abdômen.
- **C — Inferiores (posterior + glúteo + panturrilha):** Stiff/Terra Romeno, Elevação Pélvica, Mesa/Cadeira Flexora, Panturrilhas.

Os perfis são **pontos de partida editáveis**: o usuário deve poder trocar qualquer exercício por uma das alternativas cadastradas (a troca fica salva).

## 2. Dados de Cada Exercício

Use exatamente este formato no JSON local (`src/data/exercises.json`):

```json
{
  "id": "supino-reto-barra",
  "nome": "Supino Reto com Barra",
  "musculoPrincipal": "peito",
  "musculosSecundarios": ["triceps", "ombros"],
  "equipamento": "barra",
  "tipo": "multiarticular",
  "prescricao": { "series": 4, "repsMin": 8, "repsMax": 12, "descansoSeg": 90 },
  "cadencia": "2-0-2 — controle a descida",
  "passos": ["...", "...", "..."],
  "dicaSeguranca": "Escápulas retraídas, pés firmes no chão; não tire o quadril do banco.",
  "alternativas": ["supino-reto-halteres", "supino-maquina"],
  "apiRefs": { "freeExerciseDb": "Barbell_Bench_Press_-_Medium_Grip", "exerciseDbName": "barbell bench press" }
}
```

Regras de prescrição:
- Multiarticulares pesados: 90–120 s de descanso. Isoladores: 45–60 s.
- **Ajuste automático por nível** (aplicado sobre o valor base, que é o Intermediário):
  - Iniciante: −1 série (mínimo 2), faixa 12–15 reps.
  - Intermediário: valores base.
  - Avançado: +1 série nos multiarticulares, faixa 6–10 reps nos principais.
- Todo texto em **português do Brasil**, cueing curto e objetivo (máx. 2 frases).

## 3. Mídia via API Pública (com fallback)

Ordem de resolução da mídia de cada exercício:
1. **free-exercise-db** (domínio público, sem chave): carregar `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json` e montar imagens com o prefixo `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/`. Alternar as imagens de início/fim a cada 1 s para simular animação.
2. **ExerciseDB V1 gratuita** (GIFs, sem chave) como melhoria opcional, buscando pelo `exerciseDbName`.
3. **Placeholder local** (SVG com ícone do grupo muscular e o nome do exercício).

Requisitos técnicos:
- Timeout de 4 s por requisição (`AbortController`); se falhar, usar o próximo nível sem travar a UI.
- Cache do catálogo no `localStorage` (ou IndexedDB, se passar de ~4 MB) com validade de 7 dias.
- `loading="lazy"` em todas as imagens e skeleton enquanto carrega.
- Tabela de tradução EN→PT para músculos e equipamentos (ex.: `chest → Peito`, `dumbbell → Halteres`), para a biblioteca exibir tudo em português.
- Isolar todo acesso externo em `src/services/media.js`, para trocar de API sem mexer nos componentes.

## 4. Funcionalidades

**Navegação**
- Toggle de perfil no topo (Masculino/Feminino), salvo no `localStorage`; troca a paleta de cores e os treinos.
- Abas fixas no rodapé (alcance do polegar): **A · B · C · Biblioteca**.

**Filtros (combináveis, em tempo real)**
- Grupo muscular: Peito, Costas, Quadríceps, Posteriores, Glúteos, Ombros, Bíceps, Tríceps, Abdômen, Panturrilhas.
- Equipamento: Barra, Halteres, Máquinas/Polias, Peso Corporal.
- Nível: Iniciante, Intermediário, Avançado (altera séries/reps exibidas).
- Busca por nome com debounce de 200 ms, ignorando acentos e maiúsculas ("agachamento" encontra "Agachamento").
- Mostrar contador de resultados e botão "Limpar filtros". Estado vazio com mensagem útil.

**Execução do treino**
- **Checklist de séries:** um botão grande por série (não checkbox pequeno). Barra de progresso (%) do treino no topo.
- **Ao marcar uma série, iniciar automaticamente o descanso** prescrito daquele exercício (com opção de desligar).
- **Timer de descanso flutuante:** atalhos 45 s / 60 s / 90 s / 120 s, +15 s, pausar e cancelar. No fim: bipe via Web Audio API, vibração (`navigator.vibrate`) e flash visual. O tempo deve continuar correto mesmo se a aba ficar em segundo plano (calcular por timestamp, não por contagem de `setInterval`).
- **Registro de carga:** campo numérico (kg, passo de 0,5) e reps feitas por exercício, salvo automaticamente. Mostrar "Última vez: 20 kg × 10" ao lado.
- **Finalizar treino:** salvar a sessão no histórico (data, treino, cargas) e zerar o checklist. Sugerir o próximo treino da sequência (A→B→C→A).
- Manter a tela ligada durante o treino com a Wake Lock API, quando disponível.

**Modal de detalhes**
- Mídia grande, músculos principais e secundários, passo a passo numerado, cadência, dica de segurança e alternativas clicáveis (com botão "Usar esta no meu treino").
- Fecha com botão grande, toque fora ou gesto de voltar do celular.

**Dados do usuário**
- Chaves do `localStorage` com prefixo e versão (ex.: `abc:v1:perfil`, `abc:v1:cargas`), com migração simples se o formato mudar.
- Exportar/importar backup em JSON e botão "Resetar dados" (com confirmação).

## 5. Design (UI/UX)
- **Dark mode** de alto contraste (WCAG AA): fundo `#0B0F14`, cards `#141A22`.
- Destaque **Masculino:** ciano/azul elétrico (`#22D3EE`). **Feminino:** coral (`#FB7185`) com esmeralda (`#34D399`) para estados de sucesso.
- Mobile-first, uso com uma mão: alvos de toque ≥ 48 px, ações principais na metade inferior da tela, texto base ≥ 16 px, números do timer e da carga em destaque.
- Transições curtas (≤ 200 ms) e respeito a `prefers-reduced-motion`.
- Acessibilidade: `aria-label` nos botões de ícone, foco visível, modal com foco preso.

## 6. Conteúdo mínimo
- JSON local com **pelo menos 40 exercícios** completos, cobrindo os 6 treinos e todas as alternativas referenciadas (nenhum `id` em `alternativas` pode apontar para algo inexistente).
- Aviso discreto no rodapé: "Este app não substitui a orientação de um profissional de Educação Física."

## 7. Formato da entrega
1. Árvore de pastas do projeto.
2. Código completo de cada arquivo (sem "..." ou trechos omitidos).
3. Comandos para rodar (`npm install`, `npm run dev`) e para gerar o build.
4. Lista curta de decisões tomadas e limitações conhecidas.

## 8. Critérios de aceite (verifique antes de entregar)
- [ ] Com a rede desligada, o app abre e todos os treinos funcionam com placeholders.
- [ ] Trocar o perfil muda treinos e cores, e a escolha persiste ao recarregar.
- [ ] Filtros combinados + busca funcionam juntos, na aba de treino e na Biblioteca.
- [ ] Mudar o nível altera séries e reps exibidas.
- [ ] O timer toca e vibra ao terminar, mesmo após trocar de aba.
- [ ] Cargas e trocas de exercício persistem após recarregar a página.
- [ ] Nenhum erro no console e nenhuma chave de API no código.
