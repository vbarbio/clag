'use strict';

const BTN_ID = 'gcl-btn';
const SKIP_LABELS = /\b(inbox|starred|important|spam|trash|sent|draft|categories|bandeja|destacado|importante|caixa de entrada|com estrela)\b/i;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Chip detection ───────────────────────────────────────────────────────────

function isRemovable(el) {
  const a = el.getAttribute('aria-label') || '';
  return !SKIP_LABELS.test(a) && el.offsetParent !== null;
}

// Scope: contenedor que engloba TODOS los chips del email abierto.
// Subimos desde el primer chip hasta que el elemento contenga todos los demás.
function findChipScope(chips) {
  let scope = chips[0].parentElement;
  while (scope && scope !== document.body) {
    if (chips.every(c => scope.contains(c))) return scope;
    scope = scope.parentElement;
  }
  return document.body;
}

function getRemovableChips(root) {
  root = root || document;
  return [...root.querySelectorAll('.hO')].filter(isRemovable);
}

// ── Detección de estrellas ───────────────────────────────────────────────────

// Coincidencia exacta (no "not starred" / "no destacado"): solo nos interesan
// los mensajes YA destacados, para no marcar por error uno que no lo estaba.
const STARRED_RE = /^(starred|destacado|com estrela)$/i;

function getStarredToggles(root) {
  root = root || document;
  return [...root.querySelectorAll('[aria-label], [data-tooltip]')].filter(el => {
    const label = (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').trim();
    return STARRED_RE.test(label) && el.offsetParent !== null;
  });
}

// Ampliamos el scope de los chips hasta que también englobe la barra superior
// del hilo (Contraer todo / Imprimir todo...): así cubrimos todos los mensajes
// del hilo (incluidos los colapsados), no solo el mensaje abierto.
function findConversationScope(scope, rightBar) {
  if (!rightBar) return scope;
  while (scope && scope !== document.body) {
    if (scope.contains(rightBar)) return scope;
    scope = scope.parentElement;
  }
  return document.body;
}

// ── Click robusto ────────────────────────────────────────────────────────────

async function clickElement(el) {
  const rect = el.getBoundingClientRect();
  if (!rect.width && !rect.height) return false; // no visible, skip
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const base = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy };
  el.dispatchEvent(new MouseEvent('mouseover',  base));
  el.dispatchEvent(new MouseEvent('mousedown',  { ...base, button: 0 }));
  await sleep(40);
  el.dispatchEvent(new MouseEvent('mouseup',    { ...base, button: 0 }));
  el.dispatchEvent(new MouseEvent('click',      { ...base, button: 0 }));
  return true;
}

// ── Atajos de teclado ────────────────────────────────────────────────────────

// Usamos atajos de teclado nativos de Gmail en vez de clicar iconos: buscar
// el botón por atributo a veces encontraba/clicaba el elemento equivocado.
// Requiere tener activados los atajos de teclado en Gmail (Ajustes > General
// > Atajos de teclado); si están desactivados el atajo no hace nada — no hay
// forma fiable de detectarlo desde aquí.
//
// Nuestro propio botón se queda con el foco tras el clic, y el listener
// global de atajos de Gmail puede ignorar el evento si el foco no está en
// el propio documento. Le quitamos el foco antes de disparar el atajo, y
// mandamos keydown + keypress (Gmail usaba tradicionalmente keypress para
// los atajos de una letra) además de keyup, por si acaso.
async function pressKey(key, code, keyCode) {
  const opts = {
    key, code, keyCode, which: keyCode, charCode: key.charCodeAt(0),
    bubbles: true, cancelable: true, composed: true,
  };
  document.body.dispatchEvent(new KeyboardEvent('keydown', opts));
  document.body.dispatchEvent(new KeyboardEvent('keypress', opts));
  await sleep(50);
  document.body.dispatchEvent(new KeyboardEvent('keyup', opts));
}

async function blurActiveElement() {
  const activeEl = document.activeElement;
  if (activeEl && typeof activeEl.blur === 'function') activeEl.blur();
  await sleep(30);
}

// Botón "Archivar" de la barra de herramientas del hilo. Se usa solo como
// plan B si el atajo "e" no ha cerrado el hilo (por ejemplo, porque el
// usuario tiene desactivados los atajos de teclado de Gmail).
const ARCHIVE_RE = /^(archive|archivar|arquivar)$/i;

function findArchiveButton() {
  return [...document.querySelectorAll('[aria-label], [data-tooltip]')].find(el => {
    const label = (el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '').trim();
    // Solo botones de la interfaz de Gmail: nunca algo dentro del cuerpo de
    // un email (.a3s) ni un enlace, para no abrir nada que venga en un correo.
    return ARCHIVE_RE.test(label) && el.offsetParent !== null
      && el.getAttribute('role') === 'button'
      && el.getAttribute('aria-disabled') !== 'true'
      && !el.closest('.a3s, a');
  }) || null;
}

async function waitForHashChange(before, timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (location.hash !== before) return true;
    await sleep(100);
  }
  return location.hash !== before;
}

// Archiva el hilo abierto con UNA sola pulsación de "e". Después comprueba
// si Gmail ha salido del hilo (cambia el hash de la URL). Si no ha salido,
// pulsa el botón "Archivar" de la barra. Nunca repetimos la "e": una
// segunda pulsación podría archivar el siguiente hilo que Gmail abra.
async function archiveThread() {
  const before = location.hash;
  await blurActiveElement();
  await pressKey('e', 'KeyE', 69);
  if (await waitForHashChange(before, 1500)) return true;

  // Comprobamos justo antes de clicar que seguimos en el mismo hilo.
  if (location.hash !== before) return true;
  const btn = findArchiveButton();
  if (!btn) return false;
  await clickElement(btn);
  return waitForHashChange(before, 1500);
}

// Atajo nativo de Gmail para destacar/quitar estrella del hilo, en vez de
// buscar y clicar cada icono de estrella (más frágil y no cubre mensajes
// colapsados).
async function unstarThread() {
  await blurActiveElement();
  await pressKey('s', 'KeyS', 83);
}

// ── Acción principal ─────────────────────────────────────────────────────────

let clearInProgress = false;
let chipScope = null;
let conversationScope = null;

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
  // Hash del hilo abierto. Si cambia durante el proceso (Gmail ha salido del
  // hilo), no mandamos más atajos: en la lista, "s" o "e" podrían actuar
  // sobre otro hilo.
  const threadHash = location.hash;
  const stillInThread = () => location.hash === threadHash;

  // Buscamos chips en el scope guardado; si no, en todo el doc
  const chips = getRemovableChips(chipScope);

  if (!chips.length) {
    removeBtn();
    clearInProgress = false;
    return;
  }

  // Re-query tras cada click: Gmail re-renderiza todos los chips al eliminar uno,
  // por lo que las referencias guardadas quedan obsoletas.
  let removed = 0;
  let safety = 30; // máximo de iteraciones por si algo falla
  while (safety-- > 0) {
    const current = getRemovableChips(chipScope);
    if (!current.length) break;
    await clickElement(current[0]); // siempre el primero de la lista actualizada
    removed++;
    await sleep(400);
  }

  // Quitamos la estrella del hilo con el atajo "s" en vez de clicar cada
  // icono. Repetimos (máximo 5) por si el hilo tiene varios mensajes con estrella.
  let unstarred = false;
  let starSafety = 5;
  while (starSafety-- > 0 && stillInThread() && getStarredToggles(conversationScope).length) {
    await unstarThread();
    await sleep(300);
    unstarred = true;
  }

  await sleep(300); // deja asentar el DOM antes de archivar
  const archived = stillInThread() ? await archiveThread() : false;

  const n = removed;
  let label = `✓ ${n} label${n > 1 ? 's' : ''} cleared`;
  if (unstarred) label += ', ★ removed';
  if (!archived) label += ' (not archived)';
  setStyle(btn, 'ok', label);
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
        'font-size:12px', 'font-family:Google Sans,Roboto,sans-serif',
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

function findRightBar() {
  const TIPS = [
    '[data-tooltip="Collapse all"]', '[data-tooltip="Contraer todo"]',
    '[data-tooltip="Expand all"]',   '[data-tooltip="Expandir todo"]',
    '[data-tooltip="Print all"]',    '[data-tooltip="Imprimir todo"]',
    '[data-tooltip="Open in new window"]', '[data-tooltip="Abrir en una ventana nueva"]',
    '[aria-label="Collapse all"]',   '[aria-label="Contraer todo"]',
    '[aria-label="Print all"]',      '[aria-label="Imprimir todo"]',
  ];
  for (const sel of TIPS) {
    const el = document.querySelector(sel);
    if (el) return el.parentElement;
  }
  return null;
}

function injectBtn() {
  if (document.getElementById(BTN_ID)) return;

  const chips = getRemovableChips();
  if (!chips.length) return;

  // Scope = contenedor real de TODOS los chips (no solo el padre del primero)
  chipScope = findChipScope(chips);

  const btn = makeBtn();

  const rightBar = findRightBar();
  conversationScope = findConversationScope(chipScope, rightBar);
  if (rightBar) {
    rightBar.insertBefore(btn, rightBar.firstChild);
  } else {
    chipScope.appendChild(btn);
  }
}

function removeBtn() {
  document.getElementById(BTN_ID)?.remove();
  chipScope = null;
  conversationScope = null;
}

// ── Observer — throttled ─────────────────────────────────────────────────────

let moTimer = null;
new MutationObserver(() => {
  if (moTimer) return;
  moTimer = setTimeout(() => {
    moTimer = null;
    if (clearInProgress) return;
    const chips = getRemovableChips();
    if (chips.length && !document.getElementById(BTN_ID)) injectBtn();
    else if (!chips.length) removeBtn();
  }, 400);
}).observe(document.body, { childList: true, subtree: true });

setTimeout(injectBtn, 1200);
