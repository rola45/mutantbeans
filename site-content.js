const mutantContentSelectors = {"logo": ".hero-wordmark", "principal": ".hero-art", "story-mascot": ".story-mark .module-mascot", "flyer": ".tour-poster img", "gallery-1": ".gallery-tile:nth-child(1) img", "gallery-caption-1": ".gallery-tile:nth-child(1) .tile-label", "gallery-2": ".gallery-tile:nth-child(2) img", "gallery-caption-2": ".gallery-tile:nth-child(2) .tile-label", "gallery-3": ".gallery-tile:nth-child(3) img", "gallery-caption-3": ".gallery-tile:nth-child(3) .tile-label", "gallery-4": ".gallery-tile:nth-child(4) img", "gallery-caption-4": ".gallery-tile:nth-child(4) .tile-label", "gallery-5": ".gallery-tile:nth-child(5) img", "gallery-caption-5": ".gallery-tile:nth-child(5) .tile-label", "gallery-6": ".gallery-tile:nth-child(6) img", "gallery-caption-6": ".gallery-tile:nth-child(6) .tile-label", "gallery-7": ".gallery-tile:nth-child(7) img", "gallery-caption-7": ".gallery-tile:nth-child(7) .tile-label", "hero-copy": ".hero-copy", "tour-title": "#fechas .section-head h2", "story-copy": ".story-text > p:first-of-type"};
window.mutantContentReady = (async () => {
  try {
    const response = await fetch('data/site-content.json', { cache: 'no-cache', signal: AbortSignal.timeout(3500) });
    if (!response.ok) return;
    const content = await response.json();
    if (content.version !== 1 || !Array.isArray(content.fields)) return;
    const active = content.fields.filter(field => field.enabled && mutantContentSelectors[field.id]);
    for (const field of active.filter(field => field.type === 'image')) {
      if (!/^(images|imagenes)\//.test(field.value) || field.value.includes('..')) continue;
      const image = document.querySelector(mutantContentSelectors[field.id]);
      if (!image) continue;
      image.src = field.value;
      const link = image.closest('.gallery-tile, .tour-poster');
      if (link) { link.href = field.value; link.removeAttribute('target'); }
    }
    if (content.showsEnabled && Array.isArray(content.shows)) {
      const container = document.querySelector('.tour-list');
      if (container) {
        container.replaceChildren();
        for (const show of [...content.shows].sort((a,b) => a.date.localeCompare(b.date))) {
          const article = document.createElement('article'); article.className = 'tour-date';
          const time = document.createElement('time'); time.dateTime = show.date;
          const date = new Date(show.date + 'T12:00:00');
          time.textContent = new Intl.DateTimeFormat('es-MX', {day:'2-digit',month:'short'}).format(date).toUpperCase();
          const venue = document.createElement('strong'); venue.textContent = show.venue;
          const city = document.createElement('span'); city.textContent = show.city;
          const actions = document.createElement('div'); actions.className = 'tour-actions';
          const map = document.createElement('a'); map.className = 'tour-map';
          map.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(show.venue + ', ' + show.city);
          map.textContent = 'Mapa ↗'; map.target = '_blank'; map.rel = 'noopener noreferrer';
          const contact = document.createElement('a'); contact.className = 'tour-contact-link';
          contact.href = 'https://www.instagram.com/mutantbeans/'; contact.textContent = 'Contactar ↗'; contact.target = '_blank'; contact.rel = 'noopener noreferrer';
          actions.append(map, contact); article.append(time, venue, city, actions); container.append(article);
        }
      }
    }
    window.applyMutantContentLanguage = language => {
      for (const field of active.filter(field => field.type === 'text')) {
        const element = document.querySelector(mutantContentSelectors[field.id]);
        if (element) element.textContent = language === 'en' ? field.en : field.es;
      }
      if (content.showsEnabled) document.querySelectorAll('.tour-date time').forEach(time => {
        time.textContent = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-MX', {day:'2-digit',month:'short'}).format(new Date(time.dateTime + 'T12:00:00')).toUpperCase();
      });
    };
  } catch (error) { console.warn('Contenido del panel no disponible; se conserva la página.', error.name); }
})();
