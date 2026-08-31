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
    id: 'notas', nome: 'Carrossel (Notas)', tipo: 'single',
    formatos: ['4:5', '1:1', '9:16'],
    campos: [
      { id: 'texto', label: 'Texto do card (**negrito**, =destaque=, ## título, --- divisória)', tipo: 'textarea', principal: true, placeholder: '**Título do card**\n=destaque amarelo=\nTexto normal aqui' },
      { id: 'header', label: 'Mostrar cabeçalho "Notas"', tipo: 'check', valorPadrao: true },
      { id: 'imagem', label: 'Imagem de fundo (opcional)', tipo: 'image', bg: true }
    ],
    render: renderNotasCard
  },
  twitter: {
    id: 'twitter', nome: 'Post estilo Twitter', tipo: 'single',
    formatos: ['9:16', '1:1'],
    campos: [
      { id: 'nome', label: 'Nome do especialista', tipo: 'text', fixo: true, placeholder: 'RENAN KAMINSKI' },
      { id: 'user', label: '@ do perfil', tipo: 'text', fixo: true, placeholder: '@renankaminski' },
      { id: 'foto', label: 'Foto de perfil', tipo: 'image' },
      { id: 'verificado', label: 'Selo verificado (azul)', tipo: 'check', valorPadrao: true },
      { id: 'texto', label: 'Texto do post', tipo: 'textarea', principal: true, placeholder: 'Depois de 15 anos eu finalmente consegui criar o melhor treinamento que existe para donos de empresas' }
    ],
    render: renderTwitter
  },
  mancheteA: {
    id: 'mancheteA', nome: 'Manchete (faixa + título grande)', tipo: 'single',
    formatos: ['9:16', '1:1'],
    campos: [
      { id: 'kicker', label: 'Faixa', tipo: 'text', placeholder: 'Pare de focar apenas em vender mais' },
      { id: 'cor_acento', label: 'Cor da faixa', tipo: 'cor', valorPadrao: '#8a1414' },
      { id: 'titulo', label: 'Título grande', tipo: 'textarea', principal: true, placeholder: 'COMECE A FOCAR\nNO LUCRO' },
      { id: 'subtitulo', label: 'Subtítulo', tipo: 'textarea', placeholder: 'Descubra como aumentar sua lucratividade através de pura eficiência operacional.' },
      { id: 'imagem', label: 'Imagem de fundo (opcional)', tipo: 'image', bg: true }
    ],
    render: renderMancheteA
  },
  mancheteB: {
    id: 'mancheteB', nome: 'Manchete (título + destaque)', tipo: 'single',
    formatos: ['9:16', '1:1'],
    campos: [
      { id: 'titulo', label: 'Linha 1', tipo: 'text', principal: true, placeholder: 'Quem joga como amador,' },
      { id: 'destaque', label: 'Destaque', tipo: 'text', placeholder: 'COLHE RESULTADOS DE AMADOR' },
      { id: 'cor_acento', label: 'Cor do destaque', tipo: 'cor', valorPadrao: '#8a1414' },
      { id: 'subtitulo', label: 'Subtítulo', tipo: 'textarea', placeholder: 'Pare de improvisar a gestão do seu negócio. Tenha método, técnica e previsibilidade de caixa.' },
      { id: 'imagem', label: 'Imagem de fundo (opcional)', tipo: 'image', bg: true }
    ],
    render: renderMancheteB
  },
  citacao: {
    id: 'citacao', nome: 'Citação', tipo: 'single', bgPadrao: '#011527',
    formatos: ['4:5', '1:1', '9:16'],
    campos: [
      { id: 'citacao', label: 'Frase / citação', tipo: 'textarea', principal: true, placeholder: 'O =começo= é a parte mais **importante** do trabalho.' },
      { id: 'autor', label: 'Autor', tipo: 'text', fixo: true, placeholder: 'Platão' },
      { id: 'papel', label: 'Descrição do autor', tipo: 'text', fixo: true, placeholder: 'Filósofo grego' },
      { id: 'cor_acento', label: 'Cor de destaque', tipo: 'cor', valorPadrao: '#F6BF00' },
      { id: 'imagem', label: 'Imagem de fundo (opcional)', tipo: 'image', bg: true }
    ],
    render: renderCitacao
  },
  frase: {
    id: 'frase', nome: 'Frase minimalista', tipo: 'single', bgPadrao: '#F1F3F9',
    formatos: ['1:1', '4:5', '9:16'],
    campos: [
      { id: 'frase', label: 'Frase', tipo: 'textarea', principal: true, placeholder: 'admiráveis são aqueles que assumem a própria humanidade e trazem consigo a beleza e o caos de ser quem realmente são.' },
      { id: 'autor', label: 'Autor', tipo: 'text', fixo: true, placeholder: 'joão de barros' }
    ],
    render: renderFrase
  },
  checklist: {
    id: 'checklist', nome: 'Pergunta + Checklist + CTA', tipo: 'single', bgPadrao: '#0B0B0F',
    formatos: ['4:5', '9:16', '1:1'],
    campos: [
      { id: 'pergunta', label: 'Pergunta (título)', tipo: 'textarea', principal: true, placeholder: 'O QUE SEPARA SUA EMPRESA DO PRÓXIMO MILHÃO EM FATURAMENTO?' },
      { id: 'itens', label: 'Itens (um por linha)', tipo: 'textarea', placeholder: 'Mais vendas?\nUma oferta melhor?\nEquipe?\nMargem?\nProcesso comercial?' },
      { id: 'subtitulo', label: 'Subtítulo', tipo: 'textarea', placeholder: 'Você não precisa adivinhar.\nVamos diagnosticar pra você.' },
      { id: 'cta', label: 'Botão (CTA)', tipo: 'text', placeholder: 'QUERO MEU DIAGNÓSTICO' },
      { id: 'cor_acento', label: 'Cor de destaque', tipo: 'cor', valorPadrao: '#1E8E63' }
    ],
    render: renderChecklist
  },
  passos: {
    id: 'passos', nome: 'Passo a passo', tipo: 'single', bgPadrao: '#F1F3F9',
    formatos: ['4:5', '9:16', '1:1'],
    campos: [
      { id: 'titulo', label: 'Título', tipo: 'textarea', principal: true, placeholder: 'COMO FORMAR UM LÍDER DENTRO DA SUA EMPRESA' },
      { id: 'passos', label: 'Passos (um por linha: RÓTULO | descrição)', tipo: 'textarea', placeholder: 'IDENTIFIQUE O POTENCIAL | Encontre alguém com vontade de crescer e assumir responsabilidades.\nDEFINA A FUNÇÃO | Deixe claro pelo que a pessoa é responsável e quais decisões pode tomar.\nDELEGUE | Passe responsabilidades gradualmente conforme a pessoa evolui.' },
      { id: 'rodape', label: 'Rodapé', tipo: 'text', placeholder: 'LEIA A LEGENDA!' },
      { id: 'cor_acento', label: 'Cor dos rótulos', tipo: 'cor', valorPadrao: '#004882' }
    ],
    render: renderPassos
  },
  frasefoto: {
    id: 'frasefoto', nome: 'Frase sobre foto', tipo: 'single', bgPadrao: '#111111',
    formatos: ['4:5', '9:16', '1:1'],
    campos: [
      { id: 'linhas', label: 'Blocos de texto (um por linha)', tipo: 'textarea', principal: true, placeholder: 'Você **paga caro** em curso de lançamento...\nmas ignora as aulas avançadas que eu dou (de graça) =toda quarta=.\nClica no botão e se inscreve pra participar.' },
      { id: 'imagem', label: 'Imagem de fundo', tipo: 'image', bg: true }
    ],
    render: renderFraseFoto
  }
};

/* ── Cores de fundo disponíveis (RF: mais opções + fundo escuro) ─────────── */
const CORES_FUNDO = ['#FFFFFF', '#F4F5FF', '#F1F3F9', '#F6BF00', '#1998FF', '#0072CE', '#004882', '#011527', '#051F38', '#111111'];

/* Cores de acento (faixa da Manchete A / destaque da Manchete B). */
const CORES_ACENTO = [
  { nome: 'Vermelho', hex: '#8a1414' },
  { nome: 'Azul', hex: '#0072CE' },
  { nome: 'Azul escuro', hex: '#004882' },
  { nome: 'Verde', hex: '#1E8E63' },
  { nome: 'Dourado', hex: '#F6BF00' },
  { nome: 'Preto', hex: '#111111' }
];

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
    ' f-' + String(estado.format).replace(':', '-') +
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

// Igual ao elTexto, mas interpreta a marcação da copy: **/*negrito*, _itálico_, =destaque=.
// É o que faz a formatação do carrossel valer em todos os modelos.
function elMarkup(tag, classe, texto) {
  const el = document.createElement(tag);
  el.className = classe;
  const t = (texto || '').replace(/\*\*/g, '*'); // **negrito** vira *negrito* (inline)
  if (typeof parseInline === 'function') el.appendChild(parseInline(t));
  else el.textContent = texto || '';
  return el;
}

// Posiciona a imagem por tamanho/posição (não por transform) — compatível com
// a exportação (html2canvas), sem deformar. zoom<1 mostra mais; zoom>1 aproxima.
function posicionarImagem(inner, img) {
  const zoom = img.zoom || 1;
  inner.style.width = (zoom * 100) + '%';
  inner.style.height = (zoom * 100) + '%';
  inner.style.left = ((50 - 50 * zoom) + (img.x || 0)) + '%';
  inner.style.top = ((50 - 50 * zoom) + (img.y || 0)) + '%';
  inner.style.backgroundImage = 'url("' + String(img.src).replace(/"/g, '\\"') + '")';
}

// Imagem de fundo (cover) com overlay ajustável atrás do conteúdo.
function aplicarFundoImagem(card, img) {
  if (!img || !img.src) return;
  card.classList.add('com-imagem');
  const bg = document.createElement('div');
  bg.className = 'art-bg';
  const inner = document.createElement('div');
  inner.className = 'art-bg-img';
  posicionarImagem(inner, img);
  bg.appendChild(inner);
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
    const inner = document.createElement('div');
    inner.className = 'tw-avatar-img';
    posicionarImagem(inner, f.foto);
    avatar.appendChild(inner);
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
  safe.appendChild(elMarkup('div', 'tw-body', f.texto || 'Escreva aqui o texto do post.'));
  return card;
}

/* ── Modelo: Manchete A (faixa vermelha + título grande) ─────────────────── */
function renderMancheteA(estado) {
  const f = estado.fields || {};
  const { card, safe } = novaArtCard(estado, 'tpl-manchete mca');
  aplicarFundoImagem(card, f.imagem);

  if (f.kicker) {
    const k = elMarkup('div', 'kicker', f.kicker);
    const cor = f.cor_acento || '#8a1414';
    k.style.background = cor;
    k.style.color = textoClaro(cor) ? '#fff' : '#111';
    safe.appendChild(k);
  }
  safe.appendChild(elMarkup('div', 'headline', f.titulo || 'TÍTULO GRANDE'));
  if (f.subtitulo) safe.appendChild(elMarkup('div', 'subtitulo', f.subtitulo));
  return card;
}

/* ── Modelo: Manchete B (título + destaque vermelho) ─────────────────────── */
function renderMancheteB(estado) {
  const f = estado.fields || {};
  const { card, safe } = novaArtCard(estado, 'tpl-manchete mcb');
  aplicarFundoImagem(card, f.imagem);

  const bloco = document.createElement('div');
  bloco.className = 'mcb-bloco';
  bloco.appendChild(elMarkup('div', 'titulo', f.titulo || 'Linha do título,'));
  const dest = elMarkup('div', 'destaque', f.destaque || 'DESTAQUE EM VERMELHO');
  dest.style.color = f.cor_acento || '#8a1414';
  bloco.appendChild(dest);
  safe.appendChild(bloco);
  if (f.subtitulo) safe.appendChild(elMarkup('div', 'subtitulo', f.subtitulo));
  return card;
}

/* ── Modelo: Carrossel (Notas) — agora card-based ────────────────────────── */

// Interpreta o bloco de texto de UM card Notas em linhas tipadas.
function parseBlocoNotas(texto) {
  const lines = [];
  (texto || '').split('\n').map(l => l.trim()).forEach(t => {
    if (t === '') return;
    if (/^---/.test(t)) { lines.push({ type: 'divider' }); return; }
    if (/^##\s+/.test(t)) { lines.push({ type: 'step-title', text: t.replace(/^##\s+/, '') }); return; }
    if (/^\*\*(.+)\*\*$/.test(t)) {
      const text = t.replace(/^\*\*/, '').replace(/\*\*$/, '');
      lines.push({ type: lines.length === 0 ? 'cover-title' : 'line-bold', text });
      return;
    }
    lines.push({ type: 'line', text: t });
  });
  return lines;
}

function renderNotasCard(estado) {
  const f = estado.fields || {};
  const bg = estado.bg || '#FFFFFF';
  const card = document.createElement('div');
  card.id = 'card-0';
  card.className = 'art-card tpl-notas f-' + String(estado.format).replace(':', '-') +
    (textoClaro(bg) ? ' txt-claro' : ' txt-escuro');
  card.style.background = bg;
  card.style.setProperty('--escala', estado.escala || 1);
  aplicarFundoImagem(card, f.imagem);

  const fill = document.createElement('div');
  fill.className = 'notas-fill';

  if (f.header !== false) {
    const header = document.createElement('div');
    header.className = 'notas-header';
    header.innerHTML = '<div class="nh-left"><span class="nh-chevron">‹</span> Notas</div>' +
      '<div class="nh-right"><span class="nh-dots">···</span><span class="nh-ok">OK</span></div>';
    fill.appendChild(header);
  }

  const body = document.createElement('div');
  body.className = 'notas-body';
  parseBlocoNotas(f.texto).forEach(l => {
    if (l.type === 'divider') { const d = document.createElement('div'); d.className = 'card-divider'; body.appendChild(d); return; }
    body.appendChild(elMarkup('p', l.type, l.text));
  });
  fill.appendChild(body);
  card.appendChild(fill);
  return card;
}

/* ── Modelos novos (adaptados 4blue) ─────────────────────────────────────── */

// Art-card que preenche o quadro inteiro (para modelos densos), sem a zona 1:1.
function novaArtCardFill(estado, classeModelo) {
  const bg = estado.bg || '#FFFFFF';
  const card = document.createElement('div');
  card.id = 'card-0';
  card.className = 'art-card ' + classeModelo + ' f-' + String(estado.format).replace(':', '-') +
    (textoClaro(bg) ? ' txt-claro' : ' txt-escuro');
  card.style.background = bg;
  card.style.setProperty('--escala', estado.escala || 1);
  const fill = document.createElement('div');
  fill.className = 'fill';
  card.appendChild(fill);
  return { card, fill };
}

function renderCitacao(estado) {
  const f = estado.fields || {};
  const acc = f.cor_acento || '#F6BF00';
  const { card, fill } = novaArtCardFill(estado, 'tpl-citacao');
  aplicarFundoImagem(card, f.imagem);
  const aspas = elTexto('div', 'cit-aspas', '“');
  aspas.style.color = acc;
  fill.appendChild(aspas);
  fill.appendChild(elMarkup('div', 'cit-texto', f.citacao || 'Sua frase de impacto aqui.'));
  const rod = document.createElement('div'); rod.className = 'cit-rodape';
  const aut = elTexto('div', 'cit-autor', '– ' + (f.autor || 'Autor')); aut.style.color = acc;
  rod.appendChild(aut);
  if (f.papel) rod.appendChild(elTexto('div', 'cit-papel', f.papel));
  fill.appendChild(rod);
  return card;
}

function renderFrase(estado) {
  const f = estado.fields || {};
  const { card, safe } = novaArtCard(estado, 'tpl-frase');
  safe.appendChild(elMarkup('div', 'frase-texto', f.frase || 'uma frase leve e marcante.'));
  if (f.autor) safe.appendChild(elTexto('div', 'frase-autor', '— ' + f.autor));
  return card;
}

function renderChecklist(estado) {
  const f = estado.fields || {};
  const acc = f.cor_acento || '#1E8E63';
  const { card, fill } = novaArtCardFill(estado, 'tpl-checklist');
  const perg = elMarkup('div', 'ck-pergunta', f.pergunta || 'PERGUNTA DE IMPACTO?');
  perg.style.color = acc;
  fill.appendChild(perg);
  const lista = document.createElement('div'); lista.className = 'ck-lista';
  (f.itens || '').split('\n').map(s => s.trim()).filter(Boolean).forEach(it => {
    const row = document.createElement('div'); row.className = 'ck-item';
    const b = document.createElement('span'); b.className = 'ck-bola'; b.style.borderColor = acc;
    row.appendChild(b);
    row.appendChild(elMarkup('span', 'ck-txt', it));
    lista.appendChild(row);
  });
  fill.appendChild(lista);
  if (f.subtitulo) { const s = elMarkup('div', 'ck-sub', f.subtitulo); s.style.color = acc; fill.appendChild(s); }
  if (f.cta) { const cta = elTexto('div', 'ck-cta', f.cta); cta.style.background = acc; cta.style.color = textoClaro(acc) ? '#fff' : '#111'; fill.appendChild(cta); }
  return card;
}

function renderPassos(estado) {
  const f = estado.fields || {};
  const acc = f.cor_acento || '#004882';
  const { card, fill } = novaArtCardFill(estado, 'tpl-passos');
  const tit = elMarkup('div', 'ps-titulo', f.titulo || 'TÍTULO DO PASSO A PASSO'); tit.style.color = acc;
  fill.appendChild(tit);
  const lista = document.createElement('div'); lista.className = 'ps-lista';
  (f.passos || '').split('\n').map(s => s.trim()).filter(Boolean).forEach(linha => {
    const partes = linha.split('|');
    const rot = (partes.shift() || '').trim();
    const row = document.createElement('div'); row.className = 'ps-row';
    const lab = elTexto('div', 'ps-label', rot); lab.style.background = acc; lab.style.color = textoClaro(acc) ? '#fff' : '#111';
    row.appendChild(lab);
    const seta = elTexto('div', 'ps-seta', '›'); seta.style.color = acc; row.appendChild(seta);
    row.appendChild(elMarkup('div', 'ps-desc', partes.join('|').trim()));
    lista.appendChild(row);
  });
  fill.appendChild(lista);
  if (f.rodape) { const r = elTexto('div', 'ps-rodape', f.rodape); r.style.color = acc; fill.appendChild(r); }
  return card;
}

function renderFraseFoto(estado) {
  const f = estado.fields || {};
  const { card, fill } = novaArtCardFill(estado, 'tpl-frasefoto');
  aplicarFundoImagem(card, f.imagem);
  (f.linhas || '').split('\n').map(s => s.trim()).filter(Boolean).forEach(l => {
    const box = document.createElement('div'); box.className = 'ff-box-wrap';
    box.appendChild(elMarkup('span', 'ff-box', l));
    fill.appendChild(box);
  });
  return card;
}
