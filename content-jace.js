'use strict';

const BTN_ID = 'jcl-btn';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Detección de la fila de etiquetas del hilo abierto ──────────────────────
//
// El header del hilo abierto tiene un <label> con texto "Subject:" y, en el
// mismo contenedor, la fila de chips de etiquetas (spans con clase "group/pill")
// y el botón para añadir etiquetas. Las filas de la lista de bandeja de entrada
// también usan chips "group/pill", así que hay que anclarse en "Subject:" para
// no tocarlas.

function findLabelRow() {
  const subjectLabel = [...document.querySelectorAll('label')]
    .find(el => /^Subject:/.test(el.textContent.trim()));
  if (!subjectLabel) return null;

  let container = subjectLabel;
  for (let i = 0; i < 8 && container; i++) {
    if (container.querySelector('.group\\/pill')) return container;
    container = container.parentElement;
  }
  return null;
}

function getChips(row) {
  return row ? [...row.querySelectorAll('.group\\/pill')] : [];
}

// ── Click robusto ────────────────────────────────────────────────────────────
//
// Cada chip solo elimina la etiqueta si el click llega al <svg> interno
// (el icono de la etiqueta, que también actúa como botón de borrado).
// Clickear el chip completo no basta.

function clickChip(chip) {
  const svg = chip.querySelector('svg');
  if (!svg) return false;
  svg.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  return true;
}

// ── Archivar ─────────────────────────────────────────────────────────────────
//
// Jace archiva el hilo abierto con el atajo de teclado "e" (una sola
// pulsación, a diferencia de Gmail que necesita dos). Le quitamos el foco
// a nuestro propio botón antes de disparar el atajo, porque el listener
// global puede ignorar el evento si el foco está en un elemento nuestro.

async function archiveThread() {
  const activeEl = document.activeElement;
  if (activeEl && typeof activeEl.blur === 'function') activeEl.blur();
  await sleep(30);

  const opts = {
    key: 'e', code: 'KeyE', keyCode: 69, which: 69, charCode: 101,
    bubbles: true, cancelable: true, composed: true,
  };
  document.body.dispatchEvent(new KeyboardEvent('keydown', opts));
  document.body.dispatchEvent(new KeyboardEvent('keypress', opts));
  await sleep(50);
  document.body.dispatchEvent(new KeyboardEvent('keyup', opts));
}

// ── Acción principal ─────────────────────────────────────────────────────────

let clearInProgress = false;

async function clearAllLabels(btn) {
  if (clearInProgress) return;
  clearInProgress = true;
  setStyle(btn, 'busy');
  try {
    await runClear(btn);
  } catch (err) {
    console.warn('[CLAG]', err);
    removeBtn();
    clearInProgress = false;
  }
}

async function runClear(btn) {

  let removed = 0;
  let safety = 30;
  while (safety-- > 0) {
    const row = findLabelRow();
    const chips = getChips(row);
    if (!chips.length) break;
    if (!clickChip(chips[0])) break;
    removed++;
    await sleep(400);
  }

  const n = removed;
  if (!n) {
    removeBtn();
    clearInProgress = false;
    return;
  }

  await sleep(300); // deja asentar el DOM antes de archivar
  // Solo archivamos si el hilo sigue abierto: en la lista, "e" podría
  // archivar otro hilo.
  if (findLabelRow() || document.querySelector('label') && [...document.querySelectorAll('label')].some(el => /^Subject:/.test(el.textContent.trim()))) {
    await archiveThread();
  }

  setStyle(btn, 'ok', `✓ ${n} label${n > 1 ? 's' : ''} cleared`);
  setTimeout(() => { removeBtn(); clearInProgress = false; }, 2500);
}

// ── Estilos del botón ────────────────────────────────────────────────────────

function setStyle(btn, state, label) {
  switch (state) {
    case 'idle':
      btn.style.cssText = [
        'display:inline-flex', 'align-items:center', 'justify-content:center',
        'margin:0 4px', 'padding:4px 8px', 'border-radius:4px',
        'background:#fce8e6', 'color:#c5221f', 'border:1px solid #f5c6c4',
        'font-size:12px', 'font-family:inherit',
        'cursor:pointer', 'white-space:nowrap', 'vertical-align:middle',
        'user-select:none', 'height:24px', 'box-sizing:border-box',
      ].join(';');
      btn.textContent = 'CLA Now';
      btn.title = 'Clear all labels and archive this thread';
      break;
    case 'busy':
      btn.style.opacity = '0.5';
      btn.style.cursor = 'wait';
      btn.textContent = '…';
      break;
    case 'ok':
      btn.style.opacity = '1';
      btn.style.cursor = 'default';
      btn.style.background = '#e6f4ea';
      btn.style.color = '#137333';
      btn.style.borderColor = '#b7dfba';
      btn.textContent = label || '✓';
      break;
  }
}

// ── Botón ────────────────────────────────────────────────────────────────────

function makeBtn() {
  const btn = document.createElement('span');
  btn.id = BTN_ID;
  setStyle(btn, 'idle');
  btn.addEventListener('click', e => { e.stopPropagation(); clearAllLabels(btn); });
  return btn;
}

// ── Inyección ────────────────────────────────────────────────────────────────

function injectBtn() {
  if (document.getElementById(BTN_ID)) return;

  const row = findLabelRow();
  const chips = getChips(row);
  if (!row || !chips.length) return;

  const btn = makeBtn();
  const addLabelBtn = row.querySelector('button');
  if (addLabelBtn) {
    addLabelBtn.parentElement.insertBefore(btn, addLabelBtn);
  } else {
    row.appendChild(btn);
  }
}

function removeBtn() {
  document.getElementById(BTN_ID)?.remove();
}

// ── Observer — throttled ─────────────────────────────────────────────────────

let moTimer = null;
new MutationObserver(() => {
  if (moTimer) return;
  moTimer = setTimeout(() => {
    moTimer = null;
    if (clearInProgress) return;
    const chips = getChips(findLabelRow());
    if (chips.length && !document.getElementById(BTN_ID)) injectBtn();
    else if (!chips.length) removeBtn();
  }, 400);
}).observe(document.body, { childList: true, subtree: true });

setTimeout(injectBtn, 1200);
