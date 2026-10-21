(() => {
  fetch('/data/visibility-config.json', { cache: 'no-cache' })
    .then((response) => response.ok ? response.json() : null)
    .then((config) => {
      const token = String(config?.cloudflareWebAnalyticsToken || '').trim();
      if (!/^[a-f0-9-]{32,64}$/i.test(token)) return;
      if (document.querySelector('script[data-cf-beacon]')) return;
      const beacon = document.createElement('script');
      beacon.defer = true;
      beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      beacon.dataset.cfBeacon = JSON.stringify({ token });
      document.head.append(beacon);
    })
    .catch(() => {});
})();
