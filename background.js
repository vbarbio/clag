'use strict';

// Atajo de teclado (por defecto Alt+Shift+L, editable en
// chrome://extensions/shortcuts). Solo avisa a la pestaña activa; el content
// script decide si hay un hilo con etiquetas abierto y, si no, no hace nada.
chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== 'clear-labels' || !tab || tab.id == null) return;
  chrome.tabs.sendMessage(tab.id, { type: 'clag-run' }).catch(() => {
    // La pestaña no es Gmail, Jace ni Superhuman: no hay nada que hacer.
  });
});
