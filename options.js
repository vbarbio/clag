'use strict';

const current = document.getElementById('current');
document.getElementById('version').textContent = chrome.runtime.getManifest().version;

// Muestra el atajo que el usuario tiene asignado ahora mismo (puede ser
// distinto del de por defecto, o estar vacío si choca con otra extensión).
function showShortcut() {
  chrome.commands.getAll(commands => {
    const cmd = commands.find(c => c.name === 'clear-labels');
    current.textContent = '';
    if (cmd && cmd.shortcut) {
      const kbd = document.createElement('kbd');
      kbd.textContent = cmd.shortcut;
      current.appendChild(kbd);
    } else {
      const span = document.createElement('span');
      span.className = 'unset';
      span.textContent = 'Not set';
      current.appendChild(span);
    }
  });
}

// Chrome no deja cambiar el atajo desde la extensión: solo podemos llevar
// al usuario a la página de atajos del navegador.
document.getElementById('change').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

// Al volver a esta pestaña o ventana, refrescamos por si lo ha cambiado.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) showShortcut();
});

showShortcut();
