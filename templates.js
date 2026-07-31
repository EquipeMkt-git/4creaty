/**
 * templates.js — Catálogo de modelos do 4creaty.
 *
 * Cada modelo declara seus campos e uma função render(estado) que devolve o
 * elemento .art-card (id "card-0") já no formato e cor escolhidos. O modelo
 * "notas" (carrossel do designer) continua no fluxo antigo (parser+renderer);
 * os demais são de card único e usam campos estruturados.
 *
 * estado = { templateId, format:'9:16'|'1:1', bg:'#hex', fields:{...} }
 */

const TEMPLATES = {
  notas: {
    id: 'notas', nome: 'Carrossel (Notas)', tipo: 'carrossel',
    formatos: ['4:5'], campos: null
  },
  twitter: {
    id: 'twitter', nome: 'Post estilo Twitter', tipo: 'single',
    formatos: ['9:16', '1:1'],
    campos: [
      { id: 'nome', label: 'Nome do especialista', tipo: 'text', placeholder: 'RENAN KAMINSKI' },
      { id: 'user', label: '@ do perfil', tipo: 'text', placeholder: '@renankaminski' },
      { id: 'foto', label: 'Foto de perfil', tipo: 'image' },
      { id: 'verificado', label: 'Selo verificado (azul)', tipo: 'check', valorPadrao: true },
      { id: 'texto', label: 'Texto do post', tipo: 'textarea', placeholder: 'Depois de 15 anos eu finalmente consegui criar o melhor treinamento que existe para donos de empresas' }
    ],
    render: renderTwitter
  },
  mancheteA: {
    id: 'mancheteA', nome: 'Manchete (faixa + título grande)', tipo: 'single',
    formatos: ['9:16', '1:1'],
    campos: [
      { id: 'kicker', label: 'Faixa (vermelho)', tipo: 'text', placeholder: 'Pare de focar apenas em vender mais' },
      { id: 'titulo', label: 'Título grande', tipo: 'textarea', placeholder: 'COMECE A FOCAR\nNO LUCRO' },
      { id: 'subtitulo', label: 'Subtítulo', tipo: 'textarea', placeholder: 'Descubra como aumentar sua lucratividade através de pura eficiência operacional.' },
      { id: 'imagem', label: 'Imagem de fundo (opcional)', tipo: 'image', bg: true }
    ],
    render: renderMancheteA
  },
  mancheteB: {
    id: 'mancheteB', nome: 'Manchete (título + destaque)', tipo: 'single',
    formatos: ['9:16', '1:1'],
    campos: [
      { id: 'titulo', label: 'Linha 1', tipo: 'text', placeholder: 'Quem joga como amador,' },
      { id: 'destaque', label: 'Destaque (vermelho)', tipo: 'text', placeholder: 'COLHE RESULTADOS DE AMADOR' },
      { id: 'subtitulo', label: 'Subtítulo', tipo: 'textarea', placeholder: 'Pare de improvisar a gestão do seu negócio. Tenha método, técnica e previsibilidade de caixa.' },
      { id: 'imagem', label: 'Imagem de fundo (opcional)', tipo: 'image', bg: true }
    ],
    render: renderMancheteB
  }
};

/* ── Cores de fundo disponíveis (RF: mais opções + fundo escuro) ─────────── */
const CORES_FUNDO = ['#FFFFFF', '#F1F3F9', '#011527', '#051F38', '#1B2D5B', '#111111'];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

// Decide cor de texto por luminância do fundo (claro sobre escuro e vice-versa).
function textoClaro(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.55; // true = fundo escuro → texto claro
}

function novaArtCard(estado, classeModelo) {
  const card = document.createElement('div');
  const bg = estado.bg || '#FFFFFF';
  card.id = 'card-0';
  card.className = 'art-card ' + classeModelo +
    (estado.format === '1:1' ? ' f-1-1' : ' f-9-16') +
    (textoClaro(bg) ? ' txt-claro' : ' txt-escuro');
  card.style.background = bg;
  card.style.setProperty('--escala', estado.escala || 1);

  const safe = document.createElement('div');
  safe.className = 'safe';
  card.appendChild(safe);
  return { card, safe };
}

function elTexto(tag, classe, texto) {
  const el = document.createElement(tag);
  el.className = classe;
  el.textContent = texto || '';
  return el;
}

// Insere imagem de fundo (cover) com overlay ajustável atrás do conteúdo.
function aplicarFundoImagem(card, img) {
  if (!img || !img.src) return;
  card.classList.add('com-imagem');
  const bg = document.createElement('div');
  bg.className = 'art-bg';
  const el = document.createElement('img');
  el.className = 'img-fill';
  el.src = img.src;
  el.style.transform = 'translate(' + (img.x || 0) + '%, ' + (img.y || 0) + '%) scale(' + (img.zoom || 1) + ')';
  bg.appendChild(el);
  const ov = document.createElement('div');
  ov.className = 'art-overlay';
  ov.style.opacity = img.overlay != null ? img.overlay : 0.35;
  card.insertBefore(ov, card.firstChild);
  card.insertBefore(bg, card.firstChild);
}

function svgVerificado() {
  const span = document.createElement('span');
  span.className = 'tw-badge';
  span.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">' +
    '<path fill="#1D9BF0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.68.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.66-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/>' +
    '<path fill="#fff" d="M9.8 16.3l-3.6-3.6 1.4-1.4 2.2 2.2 4.8-4.8 1.4 1.4z"/></svg>';
  return span;
}

/* ── Modelo: Twitter / X ─────────────────────────────────────────────────── */
function renderTwitter(estado) {
  const f = estado.fields || {};
  const { card, safe } = novaArtCard(estado, 'tpl-twitter');

  const head = document.createElement('div');
  head.className = 'tw-head';

  const avatar = document.createElement('div');
  avatar.className = 'tw-avatar';
  if (f.foto && f.foto.src) {
    const img = document.createElement('img');
    img.className = 'img-fill';
    img.src = f.foto.src;
    img.style.transform = 'translate(' + (f.foto.x || 0) + '%, ' + (f.foto.y || 0) + '%) scale(' + (f.foto.zoom || 1) + ')';
    avatar.appendChild(img);
  }
  head.appendChild(avatar);

  const info = document.createElement('div');
  info.className = 'tw-info';
  const nome = document.createElement('div');
  nome.className = 'tw-name';
  nome.appendChild(document.createTextNode(f.nome || 'NOME DO ESPECIALISTA'));
  if (f.verificado !== false) nome.appendChild(svgVerificado());
  info.appendChild(nome);
  info.appendChild(elTexto('div', 'tw-user', f.user || '@usuario'));
  head.appendChild(info);

  safe.appendChild(head);
  safe.appendChild(elTexto('div', 'tw-body', f.texto || 'Escreva aqui o texto do post.'));
  return card;
}

/* ── Modelo: Manchete A (faixa vermelha + título grande) ─────────────────── */
function renderMancheteA(estado) {
  const f = estado.fields || {};
  const { card, safe } = novaArtCard(estado, 'tpl-manchete mca');
  aplicarFundoImagem(card, f.imagem);

  if (f.kicker) safe.appendChild(elTexto('div', 'kicker', f.kicker));
  safe.appendChild(elTexto('div', 'headline', f.titulo || 'TÍTULO GRANDE'));
  if (f.subtitulo) safe.appendChild(elTexto('div', 'subtitulo', f.subtitulo));
  return card;
}

/* ── Modelo: Manchete B (título + destaque vermelho) ─────────────────────── */
function renderMancheteB(estado) {
  const f = estado.fields || {};
  const { card, safe } = novaArtCard(estado, 'tpl-manchete mcb');
  aplicarFundoImagem(card, f.imagem);

  const bloco = document.createElement('div');
  bloco.className = 'mcb-bloco';
  bloco.appendChild(elTexto('div', 'titulo', f.titulo || 'Linha do título,'));
  bloco.appendChild(elTexto('div', 'destaque', f.destaque || 'DESTAQUE EM VERMELHO'));
  safe.appendChild(bloco);
  if (f.subtitulo) safe.appendChild(elTexto('div', 'subtitulo', f.subtitulo));
  return card;
}
