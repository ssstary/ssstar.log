/* theme.js — 테마/글자크기 적용 (head에서 동기 로드해 깜빡임 방지) */
(function () {
  'use strict';

  const KEYS = { theme: 'staryos-theme', fontsize: 'staryos-fontsize' };

  function apply(group, value) {
    const root = document.documentElement;
    if (!value || value === 'default') {
      delete root.dataset[group];
    } else {
      root.dataset[group] = value;
    }
  }

  apply('theme',    localStorage.getItem(KEYS.theme));
  apply('fontsize', localStorage.getItem(KEYS.fontsize));

  window.StarySettings = {
    get(group) {
      return localStorage.getItem(KEYS[group]) || 'default';
    },
    set(group, value) {
      if (!KEYS[group]) return;
      if (!value || value === 'default') {
        localStorage.removeItem(KEYS[group]);
      } else {
        localStorage.setItem(KEYS[group], value);
      }
      apply(group, value);
    },
  };
})();
