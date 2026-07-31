/**
 * app.js — Controlador principal da aplicação.
 *
 * Responsabilidades:
 *   1. Ler o texto do editor
 *   2. Chamar o parser para obter dados estruturados
 *   3. Chamar o renderer para montar os cards no DOM
 *   4. Gerenciar download individual e em lote via html2canvas
 *   5. Controlar a visibilidade do modal de ajuda
 */

// ── Estado global ────────────────────────────────────────────────────────────
let currentSlides = []; // dados dos slides atualmente renderizados

// ── Geração do carrossel ─────────────────────────────────────────────────────

/**
 * generateCarousel()
 * Lê o editor, parseia e renderiza os cards na grade.
 */
function generateCarousel() {
  const raw = document.getElementById('editor').value.trim();

  if (!raw) {
    alert('Cole um texto no editor antes de gerar o carrossel.');
    return;
  }

  // Parser → dados estruturados
  currentSlides = parseCarousel(raw);

  if (currentSlides.length === 0) {
    alert('Nenhum card encontrado. Certifique-se de usar #1, #2 … para separar os cards.');
    return;
  }

  // Limpa a grade
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  // Renderer → elementos DOM
  currentSlides.forEach((slide, index) => {
    const wrap = buildCardWrap(slide, index, downloadCard);
    grid.appendChild(wrap);
  });

  // Mostra grade e barra de download
  document.getElementById('preview-empty').style.display = 'none';
  grid.style.display = 'grid';
  document.getElementById('download-bar').style.display = 'block';
}

// ── Download ─────────────────────────────────────────────────────────────────

/**
 * downloadCard(index)
 * Exporta um único card como PNG em alta resolução (escala 4×).
 */
async function downloadCard(index) {
  const el = document.getElementById(`card-${index}`);
  if (!el) return;

  const bgColor = currentSlides[index]?.theme === 'blue' ? '#1B2D5B' : '#ffffff';

  const canvas = await html2canvas(el, {
    scale: 4,              // 4× para alta resolução (~1080px de largura)
    useCORS: true,
    backgroundColor: bgColor,
    width: el.offsetWidth,
    height: el.offsetHeight,
  });

  const link = document.createElement('a');
  link.download = `4blue-carousel-card-${index + 1}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * downloadAll()
 * Exporta todos os cards sequencialmente com um pequeno delay entre cada um
 * para evitar sobrecarga do browser.
 */
async function downloadAll() {
  for (let i = 0; i < currentSlides.length; i++) {
    await downloadCard(i);
    await sleep(400);
  }
}

// ── Utilitários ──────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clearEditor() {
  if (confirm('Deseja limpar o editor?')) {
    document.getElementById('editor').value = '';
    document.getElementById('grid').innerHTML = '';
    document.getElementById('grid').style.display = 'none';
    document.getElementById('preview-empty').style.display = 'block';
    document.getElementById('download-bar').style.display = 'none';
    currentSlides = [];
  }
}

// ── Modal de Ajuda ───────────────────────────────────────────────────────────

function openHelp() {
  document.getElementById('help-modal').style.display = 'flex';
}

function closeHelp(event) {
  // Fecha ao clicar no overlay ou no botão "Fechar"
  if (!event || event.target === document.getElementById('help-modal')) {
    document.getElementById('help-modal').style.display = 'none';
  }
}

// Fecha modal com Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeHelp();
});

// ── Atalho de teclado: Ctrl+Enter / Cmd+Enter para gerar ─────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    generateCarousel();
  }
});
