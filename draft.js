/**
 * draft.js — Autosave local (IndexedDB) para nunca perder o trabalho.
 * O post em edição é gravado no navegador a cada alteração; se o save no Drive
 * falhar ou a aba fechar, o trabalho é recuperado ao reabrir.
 */

let _dbDraft = null;

function draftDB(cb) {
  if (_dbDraft) return cb(_dbDraft);
  try {
    const req = indexedDB.open('4creaty', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('rascunho'); };
    req.onsuccess = () => { _dbDraft = req.result; cb(_dbDraft); };
    req.onerror = () => cb(null);
  } catch (e) { cb(null); }
}

let _draftT = null;
function salvarRascunho() {
  clearTimeout(_draftT);
  _draftT = setTimeout(_salvarRascunhoAgora, 1200);
}

function _salvarRascunhoAgora() {
  if (typeof estado === 'undefined') return;
  let dados;
  try {
    dados = {
      estado: JSON.parse(JSON.stringify(estado)),
      id: (typeof carrosselAtualId !== 'undefined') ? carrosselAtualId : null,
      ts: Date.now()
    };
  } catch (e) { return; }
  draftDB(db => {
    if (!db) return;
    try {
      const tx = db.transaction('rascunho', 'readwrite');
      tx.objectStore('rascunho').put(dados, 'atual');
    } catch (e) { /* quota / erro: ignora */ }
  });
}

function carregarRascunho(cb) {
  draftDB(db => {
    if (!db) return cb(null);
    try {
      const tx = db.transaction('rascunho', 'readonly');
      const r = tx.objectStore('rascunho').get('atual');
      r.onsuccess = () => cb(r.result || null);
      r.onerror = () => cb(null);
    } catch (e) { cb(null); }
  });
}

function limparRascunho() {
  draftDB(db => {
    if (!db) return;
    try { db.transaction('rascunho', 'readwrite').objectStore('rascunho').delete('atual'); } catch (e) {}
  });
}
