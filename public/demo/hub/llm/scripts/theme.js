// 로컬 허브와 독립 페이지가 같은 모드를 사용한다.
(() => {
  const key = 'kqips-theme';
  function read() {
    try { return localStorage.getItem(key) === 'dark' ? 'dark' : 'light'; }
    catch (_) { return 'light'; }
  }
  function apply(value) {
    document.documentElement.dataset.theme = value;
    if (window.parent !== window) {
      window.parent.postMessage({type: 'kqips-theme', value}, location.origin);
    }
  }
  apply(read());
  window.kqipsTheme = {
    set(value) {
      const theme = value === 'dark' ? 'dark' : 'light';
      try { localStorage.setItem(key, theme); } catch (_) { /* 저장 불가여도 현재 화면에는 적용한다. */ }
      apply(theme);
    },
    get: read,
  };
  addEventListener('storage', event => {
    if (event.key === key) apply(read());
  });
  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent
        || event.data?.type !== 'kqips-theme') return;
    apply(event.data.value === 'dark' ? 'dark' : 'light');
  });
})();
