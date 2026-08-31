/**
 * home.js — Painel inicial (estilo Canva): grade de posts com mini-preview.
 * Aba "Meus posts" (do usuário) e "Acervo" (de todos, com filtro por autor).
 * O preview é o primeiro card do post, renderizado pequeno pelo próprio modelo.
 */

let _homeAcervo = [];

function carregarHome() { mostrarHome('meus'); }

function mostrarHome(qual) {
  const tm = document.getElementById('htab-meus');
  const ta = document.getElementById('htab-acervo');
  if (tm) tm.classList.toggle('ativo', qual === 'meus');
  if (ta) ta.classList.toggle('ativo', qual === 'acervo');
  document.getElementById('home-filtro-autor').style.display = qual === 'acervo' ? 'inline-block' : 'none';
  if (qual === 'acervo') carregarHomeAcervo(); else carregarHomeMeus();
}

function precisaLogin(grid, oQue) {
  if (typeof tokenAtual === 'function' && tokenAtual()) return false;
  grid.innerHTML = '<div class="home-vazio">Entre na sua conta para ver ' + oQue +
    '. <button class="btn-secondary" onclick="abrirLogin()">Entrar</button></div>';
  return true;
}

async function carregarHomeMeus() {
  const grid = document.getElementById('home-grid');
  if (precisaLogin(grid, 'seus posts')) return;
  grid.innerHTML = '<div class="home-vazio">Carregando...</div>';
  try {
    const r = await fetch(APPS_SCRIPT_URL + '?acao=listar&token=' + encodeURIComponent(tokenAtual()));
    const d = await r.json();
    if (!d.ok || !d.itens || !d.itens.length) {
      grid.innerHTML = '<div class="home-vazio">Você ainda não criou posts. Clique em "Criar novo post".</div>';
      return;
    }
    grid.innerHTML = '';
    d.itens.forEach(item => grid.appendChild(homeCard(item, false)));
  } catch (e) { grid.innerHTML = '<div class="home-vazio">Falha ao carregar: ' + e.message + '</div>'; }
}

async function carregarHomeAcervo() {
  const grid = document.getElementById('home-grid');
  if (precisaLogin(grid, 'o acervo')) return;
  grid.innerHTML = '<div class="home-vazio">Carregando...</div>';
  try {
    const r = await fetch(APPS_SCRIPT_URL + '?acao=acervo&token=' + encodeURIComponent(tokenAtual()));
    const d = await r.json();
    if (!d.ok || !d.itens || !d.itens.length) {
      grid.innerHTML = '<div class="home-vazio">Acervo vazio.</div>';
      document.getElementById('home-filtro-autor').innerHTML = '';
      return;
    }
    _homeAcervo = d.itens;
    const autores = Array.from(new Set(_homeAcervo.map(i => i.autor || 'Sem autor'))).sort();
    document.getElementById('home-filtro-autor').innerHTML =
      '<option value="">Todos os autores</option>' + autores.map(a => '<option>' + escaparHome(a) + '</option>').join('');
    renderHomeAcervo();
  } catch (e) { grid.innerHTML = '<div class="home-vazio">Falha ao carregar: ' + e.message + '</div>'; }
}

function renderHomeAcervo() {
  const grid = document.getElementById('home-grid');
  const filtro = document.getElementById('home-filtro-autor').value;
  const itens = filtro ? _homeAcervo.filter(i => (i.autor || 'Sem autor') === filtro) : _homeAcervo;
  grid.innerHTML = '';
  if (!itens.length) { grid.innerHTML = '<div class="home-vazio">Nenhum post desse autor.</div>'; return; }
  itens.forEach(item => grid.appendChild(homeCard(item, true)));
}

function homeCard(item, acervo) {
  const div = document.createElement('div');
  div.className = 'home-post';
  const thumb = document.createElement('div');
  thumb.className = 'home-thumb';
  const prev = miniPreview(item);
  if (prev) thumb.appendChild(prev); else thumb.innerHTML = '<span class="home-thumb-vazio">sem preview</span>';
  div.appendChild(thumb);
  const nome = document.createElement('div');
  nome.className = 'home-post-nome';
  nome.textContent = item.nome || 'Sem nome';
  div.appendChild(nome);
  const meta = document.createElement('div');
  meta.className = 'home-post-meta';
  meta.textContent = (acervo ? ((item.autor || 'Sem autor') + ' · ') : '') + formatarDataHome(item.atualizado_em);
  div.appendChild(meta);

  const acoes = document.createElement('div');
  acoes.className = 'home-post-acoes';
  const bAbrir = document.createElement('button');
  bAbrir.className = 'btn-dl';
  bAbrir.textContent = acervo ? 'Usar' : 'Abrir';
  bAbrir.addEventListener('click', (e) => { e.stopPropagation(); abrirDaHome(item, acervo, false); });
  acoes.appendChild(bAbrir);
  const bDup = document.createElement('button');
  bDup.className = 'btn-dl';
  bDup.textContent = 'Duplicar';
  bDup.addEventListener('click', (e) => { e.stopPropagation(); abrirDaHome(item, acervo, true); });
  acoes.appendChild(bDup);
  div.appendChild(acoes);

  div.addEventListener('click', () => abrirDaHome(item, acervo, false));
  return div;
}

function abrirDaHome(item, acervo, duplicar) {
  document.getElementById('home-screen').style.display = 'none';
  if (acervo) { if (typeof usarDoAcervo === 'function') usarDoAcervo(item.id); }
  else { if (typeof abrirCarrossel === 'function') abrirCarrossel(item.id, duplicar); }
}

// Renderiza o primeiro card do post salvo, em miniatura (usa o próprio modelo).
function miniPreview(item) {
  try {
    const obj = JSON.parse(item.texto || '{}');
    let card0 = null, format = '4:5', bg = '#FFFFFF', escala = 1;
    if (Array.isArray(obj.cards) && obj.cards.length) {
      card0 = obj.cards[0]; format = obj.format || format; bg = obj.bg || bg; escala = obj.escala || 1;
    } else if (obj.templateId === 'notas' && typeof obj.texto === 'string') {
      const blocos = (typeof dividirBlocos === 'function') ? dividirBlocos(obj.texto) : [obj.texto];
      card0 = { templateId: 'notas', fields: { texto: blocos[0] || '', header: true } };
    }
    if (!card0 || !TEMPLATES[card0.templateId]) return null;
    const st = { templateId: card0.templateId, format: format, bg: bg, escala: escala, fields: card0.fields };
    const el = TEMPLATES[card0.templateId].render(st);
    el.removeAttribute('id');
    return el;
  } catch (e) { return null; }
}

function escaparHome(t) { const d = document.createElement('div'); d.textContent = String(t); return d.innerHTML; }
function formatarDataHome(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
