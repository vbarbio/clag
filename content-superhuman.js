'use strict';

const BTN_ID = 'shcl-btn';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Estado del hilo abierto ──────────────────────────────────────────────────

function getLabelsContainer() {
  return document.querySelector('.ThreadPane-header-labels');
}

function getLabelChips() {
  const container = getLabelsContainer();
  return container ? [...container.querySelectorAll('.ThreadLabel')] : [];
}

// ── Atajo nativo "Remove all Labels" (Shift+Y) ───────────────────────────────
//
// Superhuman no tiene una "x" en cada chip de etiqueta como Gmail o Jace,
// pero sí trae un comando nativo para vaciarlas todas de una vez (visible
// en el Command Palette, ⌘K → "Remove all Labels", atajo Shift+Y). Emulamos
// ese atajo en vez de ir quitando etiqueta a etiqueta: al quitar una sola
// etiqueta Superhuman navega automáticamente fuera del hilo (si se ve desde
// una carpeta filtrada por alguna de sus etiquetas), así que ir una a una
// arriesga operar sobre el hilo equivocado a la segunda vuelta. El atajo
// nativo hace el vaciado en una sola operación atómica.
//
// IMPORTANTE: el keydown se dispara UNA sola vez por clic, sin reintentos.
// Un reintento automático es peligroso aquí: si el primer disparo sí
// funciona pero tarda en reflejarse (Superhuman procesa el atajo de forma
// asíncrona), un segundo keydown puede llegar justo después de que la app
// ya haya navegado a la carpeta y seleccionado el siguiente hilo de la
// lista — borrando también sus etiquetas por error. Mejor que el atajo
// falle en silencio de vez en cuando (el usuario puede volver a pulsar el
// botón) a arriesgarse a tocar el hilo equivocado.

function dispatchRemoveAllLabelsShortcut() {
  const opts = {
    key: 'Y', code: 'KeyY', keyCode: 89, which: 89,
    shiftKey: true, bubbles: true, cancelable: true, composed: true,
  };
  document.dispatchEvent(new KeyboardEvent('keydown', opts));
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

  const before = getLabelChips().length;
  dispatchRemoveAllLabelsShortcut();
  await sleep(1200);
  const cleared = !getLabelChips().length;

  if (!cleared) {
    removeBtn();
    clearInProgress = false;
    return;
  }
  setStyle(btn, 'ok', `✓ ${before} label${before > 1 ? 's' : ''} cleared`);
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
      btn.title = 'Clear all labels (Alt/⌥+Shift+L)';
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

  const container = getLabelsContainer();
  if (!container || !getLabelChips().length) return;

  container.appendChild(makeBtn());
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
    const chips = getLabelChips();
    if (chips.length && !document.getElementById(BTN_ID)) injectBtn();
    else if (!chips.length) removeBtn();
  }, 400);
}).observe(document.body, { childList: true, subtree: true });

setTimeout(injectBtn, 1200);

// ── Atajo de teclado (llega desde background.js) ────────────────────────────

chrome.runtime.onMessage.addListener(msg => {
  if (!msg || msg.type !== 'clag-run' || clearInProgress) return;
  if (!document.getElementById(BTN_ID)) injectBtn();
  const btn = document.getElementById(BTN_ID);
  if (btn) clearAllLabels(btn);
});
