'use strict';
(() => {
  const dialog = document.querySelector('#resume-dialog');
  const download = document.querySelector('.resume-download');
  if (!dialog || !download || typeof dialog.showModal !== 'function') return;

  // Keep the native download link working, including without JavaScript.
  download.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!dialog.open) dialog.showModal();
  });
  dialog.querySelector('.resume-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => download.focus({ preventScroll: true }));
})();
