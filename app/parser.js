/**
 * parser.js — Converte o texto bruto do editor em dados estruturados de slides.
 *
 * SINTAXE SUPORTADA
 * ─────────────────
 * #1, #2 …        → Inicia um novo card (número é ignorado, a ordem importa)
 * :blue           → Card com fundo azul (coloque junto ao #N ou na linha ---:blue)
 * ---             → Linha divisória dentro do card
 * ## Texto        → Título de passo (step-title)
 * **Texto**       → Parágrafo inteiro em negrito (line-bold)
 * *texto*         → Negrito inline dentro de uma linha normal
 * _texto_         → Itálico inline
 * =texto=         → Destaque amarelo (highlight)
 * (linha vazia)   → Ignorada (espaçamento visual já vem do gap do flex)
 *
 * REGRA DE CAPA
 * ─────────────
 * O primeiro card sempre recebe o tipo "cover-title" para seu bloco de texto
 * principal, tornando a fonte automaticamente maior e fluida.
 */

/**
 * parseCarousel(rawText)
 * Retorna um array de objetos slide:
 *   { theme: 'white'|'blue', isCover: bool, lines: [ {type, text?} ] }
 *
 * Tipos de line:
 *   'cover-title'  — texto grande fluido (somente card 1)
 *   'step-title'   — título ## Passo X
 *   'line-bold'    — parágrafo todo negrito (**texto**)
 *   'line'         — parágrafo normal (pode ter inline markup)
 *   'divider'      — linha horizontal
 */
function parseCarousel(rawText) {
  const slides = [];
  let currentSlide = null;
  let firstCard = true;

  const lines = rawText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // ── Início de novo card: #1, #2, #N … ──────────────────────────────────
    if (/^#\d+/.test(trimmed)) {
      if (currentSlide) slides.push(currentSlide);

      const isBlue = /:blue/i.test(trimmed);
      const isCover = firstCard;
      firstCard = false;

      currentSlide = { theme: isBlue ? 'blue' : 'white', isCover, lines: [] };
      continue;
    }

    // Se ainda não temos nenhum card, ignora
    if (!currentSlide) continue;

    // ── Linha divisória: --- ou --- :blue ───────────────────────────────────
    if (/^---/.test(trimmed)) {
      // :blue no separador muda o tema do card atual
      if (/:blue/i.test(trimmed)) currentSlide.theme = 'blue';
      currentSlide.lines.push({ type: 'divider' });
      continue;
    }

    // ── Linha vazia: pula ───────────────────────────────────────────────────
    if (trimmed === '') continue;

    // ── Título de passo: ## Texto ───────────────────────────────────────────
    if (/^##\s+/.test(trimmed)) {
      const text = trimmed.replace(/^##\s+/, '');
      currentSlide.lines.push({ type: 'step-title', text });
      continue;
    }

    // ── Parágrafo todo negrito: **Texto** ───────────────────────────────────
    if (/^\*\*(.+)\*\*$/.test(trimmed)) {
      const text = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
      const type = currentSlide.isCover && currentSlide.lines.length === 0
        ? 'cover-title'
        : 'line-bold';
      currentSlide.lines.push({ type, text });
      continue;
    }

    // ── Parágrafo normal (com possível inline markup) ───────────────────────
    {
      const type = currentSlide.isCover && currentSlide.lines.length === 0
        ? 'cover-title'
        : 'line';
      currentSlide.lines.push({ type, text: trimmed });
    }
  }

  // Fecha o último card
  if (currentSlide) slides.push(currentSlide);

  return slides;
}
