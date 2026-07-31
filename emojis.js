/**
 * emojis.js — Teclado de emoji para o editor.
 * Os caracteres são padrão Unicode (os mesmos do WhatsApp/iOS/Android); a
 * aparência final depende da fonte de emoji do dispositivo que exibe/exporta.
 * Insere no último campo de texto focado (editor ou campos do modelo).
 */

const EMOJIS = {
  'Rostos': ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😋','😎','🤩','🥳','🤔','🤨','😐','😏','😒','🙄','😔','😢','😭','😤','😠','😡','🤯','😳','🥺','😱','😴','🤤','🤫','🤭','😬','🤗','🤝'],
  'Gestos': ['👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘','👌','🤌','🤏','👈','👉','👆','👇','☝️','✋','🖐️','👋','🤙','💪','🙏','👏','🙌','👐','🤲'],
  'Símbolos': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️','💕','💖','💘','💯','✅','❌','❗','❓','⚠️','⭐','🌟','✨','⚡','🔥','💥','💫','🎯','🏆'],
  'Negócios': ['💰','💵','💸','💳','📈','📉','📊','💹','🚀','💡','🔑','📌','📎','📝','📅','⏰','🎁','📢','📣','🔔','💼','🖥️','📱','💻','⚙️','🔎','📦','🤑'],
  'Setas': ['➡️','⬅️','⬆️','⬇️','↗️','↘️','▶️','⏩','🔜','🔝','🔙','↩️','↪️','🔄']
};

let campoAtivo = null;

document.addEventListener('focusin', (e) => {
  const t = e.target;
  if (t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && t.type === 'text'))) campoAtivo = t;
});

function montarEmojiPicker() {
  const p = document.getElementById('emoji-picker');
  if (!p || p.dataset.pronto) return;
  const cats = document.createElement('div'); cats.className = 'emoji-cats';
  const grid = document.createElement('div'); grid.className = 'emoji-grid';
  Object.keys(EMOJIS).forEach((cat, idx) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'emoji-cat' + (idx === 0 ? ' ativo' : ''); b.textContent = cat;
    b.addEventListener('click', () => {
      mostrarCategoria(cat);
      p.querySelectorAll('.emoji-cat').forEach(x => x.classList.remove('ativo'));
      b.classList.add('ativo');
    });
    cats.appendChild(b);
  });
  p.appendChild(cats); p.appendChild(grid); p.dataset.pronto = '1';
  mostrarCategoria(Object.keys(EMOJIS)[0]);
}

function mostrarCategoria(cat) {
  const grid = document.querySelector('#emoji-picker .emoji-grid');
  if (!grid) return;
  grid.innerHTML = '';
  EMOJIS[cat].forEach(em => {
    const s = document.createElement('button');
    s.type = 'button'; s.className = 'emoji-item'; s.textContent = em;
    s.addEventListener('click', () => inserirEmoji(em));
    grid.appendChild(s);
  });
}

function toggleEmoji() {
  const p = document.getElementById('emoji-picker');
  if (!p) return;
  montarEmojiPicker();
  p.style.display = p.style.display === 'block' ? 'none' : 'block';
}

function inserirEmoji(em) {
  const el = (campoAtivo && document.body.contains(campoAtivo))
    ? campoAtivo
    : document.querySelector('#fields-wrap textarea, #fields-wrap input[type="text"]');
  if (!el) return;
  const s = el.selectionStart != null ? el.selectionStart : el.value.length;
  const e2 = el.selectionEnd != null ? el.selectionEnd : el.value.length;
  el.value = el.value.slice(0, s) + em + el.value.slice(e2);
  const pos = s + em.length;
  el.selectionStart = el.selectionEnd = pos;
  el.focus();
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
