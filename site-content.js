const mutantContentSelectors = {"logo":".hero-wordmark","principal":".hero-art","story-mascot":".story-mark .module-mascot","flyer":".tour-poster img","gallery-1":".gallery-tile:nth-child(1) img","gallery-caption-1":".gallery-tile:nth-child(1) .tile-label","gallery-2":".gallery-tile:nth-child(2) img","gallery-caption-2":".gallery-tile:nth-child(2) .tile-label","gallery-3":".gallery-tile:nth-child(3) img","gallery-caption-3":".gallery-tile:nth-child(3) .tile-label","gallery-4":".gallery-tile:nth-child(4) img","gallery-caption-4":".gallery-tile:nth-child(4) .tile-label","gallery-5":".gallery-tile:nth-child(5) img","gallery-caption-5":".gallery-tile:nth-child(5) .tile-label","gallery-6":".gallery-tile:nth-child(6) img","gallery-caption-6":".gallery-tile:nth-child(6) .tile-label","gallery-7":".gallery-tile:nth-child(7) img","gallery-caption-7":".gallery-tile:nth-child(7) .tile-label","hero-copy":".hero-copy","tour-title":"#fechas .section-head h2","story-copy":".story-text > p:first-of-type","page-title":"title","favicon":"#site-favicon","topline-location":".topline .wrap > span:nth-child(1)","topline-tagline":".topline .wrap > span:nth-child(2)","brand-prefix":".brand-prefix","brand-name":".brand-mutant","brand-destination":".brand","nav-1":".navlinks a:nth-child(1)","nav-2":".navlinks a:nth-child(2)","nav-3":".navlinks a:nth-child(3)","nav-4":".navlinks a:nth-child(4)","nav-5":".navlinks a:nth-child(5)","header-instagram":".nav > .nav-socials a[title=\"Instagram\"]","header-facebook":".nav > .nav-socials a[title=\"Facebook\"]","header-spotify":".nav > .nav-socials a[title=\"Spotify\"]","header-youtube":".nav > .nav-socials a[title=\"YouTube\"]","header-links":".nav > .nav-socials a[title=\"Todos los enlaces\"]","cierre-instagram":".last-socials a[title=\"Instagram\"]","cierre-facebook":".last-socials a[title=\"Facebook\"]","cierre-spotify":".last-socials a[title=\"Spotify\"]","cierre-youtube":".last-socials a[title=\"YouTube\"]","cierre-bandcamp":".last-socials a[title=\"Bandcamp\"]","cierre-links":".last-socials a[title=\"Todos los enlaces\"]","hero-kicker":".hero .kicker","career-eyebrow":".career-copy .eyebrow","career-title":".career-copy strong","career-description":".career-copy > span:nth-of-type(2)","career-press":".career-press","next-show-label":".next-show-date .eyebrow","next-show-map-label":".next-show-map","next-show-contact":".next-show-contact","next-show-tour":".next-show > a.button:not(.next-show-contact)","hero-tag-1":".hero-meta .tag:nth-child(1)","hero-tag-2":".hero-meta .tag:nth-child(2)","hero-tag-3":".hero-meta .tag:nth-child(3)","hero-tag-4":".hero-meta .tag:nth-child(4)","lineup-title":"#integrantes .section-head h2","lineup-subtitle":"#integrantes .section-head p","member-1-name":".member:nth-child(1) h3","member-1-role":".member:nth-child(1) p","member-1-profile":".member:nth-child(1)","member-1-photo":".member:nth-child(1) .member-photo-rest","member-1-frame-1":".member:nth-child(1) .member-photo-action:nth-of-type(2)","member-1-frame-2":".member:nth-child(1) .member-photo-action:nth-of-type(3)","member-1-frame-3":".member:nth-child(1) .member-photo-action:nth-of-type(4)","member-2-name":".member:nth-child(2) h3","member-2-role":".member:nth-child(2) p","member-2-profile":".member:nth-child(2)","member-2-photo":".member:nth-child(2) .member-photo-rest","member-2-frame-1":".member:nth-child(2) .member-photo-action:nth-of-type(2)","member-2-frame-2":".member:nth-child(2) .member-photo-action:nth-of-type(3)","member-3-name":".member:nth-child(3) h3","member-3-role":".member:nth-child(3) p","member-3-profile":".member:nth-child(3)","member-3-photo":".member:nth-child(3) .member-photo-rest","member-3-frame-1":".member:nth-child(3) .member-photo-action:nth-of-type(2)","member-3-frame-2":".member:nth-child(3) .member-photo-action:nth-of-type(3)","member-4-name":".member:nth-child(4) h3","member-4-role":".member:nth-child(4) p","member-4-profile":".member:nth-child(4)","member-4-photo":".member:nth-child(4) .member-photo-rest","member-4-frame-1":".member:nth-child(4) .member-photo-action:nth-of-type(2)","member-4-frame-2":".member:nth-child(4) .member-photo-action:nth-of-type(3)","lineup-mascot":".lineup-mascot","tour-mascot":".tour-mascot","tour-poster-link":".tour-poster","story-quote":".story-mark blockquote","story-eyebrow":".story-text .eyebrow","story-paragraph-2":".story-text > p:nth-of-type(2)","story-milestone-1":".story-text .milestone:nth-of-type(2)","story-milestone-2":".story-text .milestone:nth-of-type(3)","story-press":".story-text p:last-child a","music-heading":"#musica .section-head h2","music-description":"#musica .section-head p","album-eyebrow":".feature .eyebrow","album-title":".feature h3","album-description":".feature > div:first-child p","album-spotify":".feature-actions a:nth-child(1)","album-bandcamp":".feature-actions a:nth-child(2)","music-mascot":".music-mascot","release-heading":".release-panel-head h3","release-description":".release-panel-head p","release-1-title":".release:nth-child(1) h3","release-1-meta":".release:nth-child(1) small","release-1-link":".release:nth-child(1) a","release-2-title":".release:nth-child(2) h3","release-2-meta":".release:nth-child(2) small","release-2-link":".release:nth-child(2) a","release-3-title":".release:nth-child(3) h3","release-3-meta":".release:nth-child(3) small","release-3-link":".release:nth-child(3) a","release-4-title":".release:nth-child(4) h3","release-4-meta":".release:nth-child(4) small","release-4-link":".release:nth-child(4) a","release-5-title":".release:nth-child(5) h3","release-5-meta":".release:nth-child(5) small","release-5-link":".release:nth-child(5) a","release-6-title":".release:nth-child(6) h3","release-6-meta":".release:nth-child(6) small","release-6-link":".release:nth-child(6) a","release-7-title":".release:nth-child(7) h3","release-7-meta":".release:nth-child(7) small","release-7-link":".release:nth-child(7) a","release-8-title":".release:nth-child(8) h3","release-8-meta":".release:nth-child(8) small","release-8-link":".release:nth-child(8) a","gallery-title":"#archivo .section-head h2","gallery-description":"#archivo .section-head p","gallery-instructions":".gallery-foot","gallery-mascot":".gallery-mascot","gallery-1-destination":".gallery-tile:nth-child(1)","gallery-2-destination":".gallery-tile:nth-child(2)","gallery-3-destination":".gallery-tile:nth-child(3)","gallery-4-destination":".gallery-tile:nth-child(4)","gallery-5-destination":".gallery-tile:nth-child(5)","gallery-6-destination":".gallery-tile:nth-child(6)","gallery-7-destination":".gallery-tile:nth-child(7)","final-cta-title":".last h2","final-cta-copy":".last > div > p","footer-copyright":".foot-row span","footer-disclaimer":".disclaimer","footer-credit":".creator-credit","career-stamp":".career-stamp","tour-contact-label":".tour-date .tour-contact-link","tour-map-label":".tour-date .tour-map","release-1-number":".release:nth-child(1) .release-num","release-2-number":".release:nth-child(2) .release-num","release-3-number":".release:nth-child(3) .release-num","release-4-number":".release:nth-child(4) .release-num","release-5-number":".release:nth-child(5) .release-num","release-6-number":".release:nth-child(6) .release-num","release-7-number":".release:nth-child(7) .release-num","release-8-number":".release:nth-child(8) .release-num"};
function setEditableText(element, value) {
  const lines = value.split(/\r?\n/);
  if (element.matches('.story-mark blockquote')) {
    const emphasis = document.createElement('em'); emphasis.textContent = lines[1] || '';
    element.replaceChildren(document.createTextNode(lines[0] || ''), document.createElement('br'), emphasis, document.createElement('br'), document.createTextNode(lines.slice(2).join(' ')));
    return;
  }
  const accent = element.matches('.section-head h2') ? element.querySelector(':scope > span') : null;
  if (accent) {
    const words = value.trim().split(/\s+/).filter(Boolean); accent.textContent = words.pop() || '';
    element.replaceChildren(document.createTextNode(words.length ? `${words.join(' ')} ` : ''), accent);
    return;
  }
  const bold = element.querySelector(':scope > strong');
  const emphasizedPhrase = value.match(/Vans Warped Tour (?:en |in )Long Beach, California/i)?.[0];
  if (bold && emphasizedPhrase) {
    const start = value.indexOf(emphasizedPhrase); bold.textContent = emphasizedPhrase;
    element.replaceChildren(document.createTextNode(value.slice(0, start)), bold, document.createTextNode(value.slice(start + emphasizedPhrase.length)));
    return;
  }
  if (element.matches('.milestone')) {
    const [lead, ...tail] = value.split(' — '), colored = element.querySelector(':scope > span');
    if (colored) { colored.textContent = lead || ''; element.replaceChildren(colored, document.createTextNode(tail.length ? ` — ${tail.join(' — ')}` : '')); }
    else element.textContent = value;
    return;
  }
  if (element.children.length && element.querySelector(':scope > br')) {
    element.replaceChildren(...lines.flatMap((line, index) => index ? [document.createElement('br'), document.createTextNode(line)] : [document.createTextNode(line)]));
    return;
  }
  element.textContent = value;
}

window.mutantContentReady = (async () => {
  if (new URLSearchParams(window.location.search).has('admin-preview')) return;
  try {
    const response = await fetch('data/site-content.json', { cache: 'no-cache', signal: AbortSignal.timeout(3500) });
    if (!response.ok) return;
    const content = await response.json();
    if (content.version !== 1 || !Array.isArray(content.fields)) return;
    const active = content.fields.filter(field => field.enabled && mutantContentSelectors[field.id]);
    for (const field of active.filter(field => field.type === 'image')) {
      if (!/^(images|imagenes)\//.test(field.value) || field.value.includes('..')) continue;
      for (const image of document.querySelectorAll(mutantContentSelectors[field.id])) {
        if (image.tagName === 'LINK' && image.id === 'site-favicon') {
          image.href = field.value; image.type = field.value.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : field.value.toLowerCase().endsWith('.webp') ? 'image/webp' : field.value.toLowerCase().endsWith('.jpg') || field.value.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
          continue;
        }
        if (image instanceof HTMLImageElement) {
          image.src = field.value;
          const tile = image.closest('.gallery-tile');
          if (tile) { tile.href = field.value; tile.removeAttribute('target'); }
        }
      }
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
          const mapLabel = active.find(field => field.id === 'tour-map-label' && field.enabled);
          const contactLabel = active.find(field => field.id === 'tour-contact-label' && field.enabled);
          if (mapLabel) map.textContent = document.documentElement.lang === 'en' ? mapLabel.en : mapLabel.es;
          if (contactLabel) {
            contact.textContent = document.documentElement.lang === 'en' ? contactLabel.en : contactLabel.es;
            contact.href = contactLabel.value;
          }
          actions.append(map, contact); article.append(time, venue, city, actions); container.append(article);
        }
      }
    }
    for (const field of active.filter(field => field.type === 'link' || field.type === 'anchor')) {
      const value = field.value;
      if (!/^(https:\/\/[^\s]+|#[\w-]+|(?:images|imagenes)\/[\w .()\/-]+\.(?:png|jpg|jpeg|webp|svg))$/i.test(value) || value.includes('..')) continue;
      for (const element of document.querySelectorAll(mutantContentSelectors[field.id])) {
        const link = element.matches('a[href]') ? element : element.querySelector('a[href]');
        if (link) link.setAttribute('href', value);
      }
    }
    window.applyMutantContentLanguage = language => {
      for (const field of active.filter(field => field.type === 'text' || field.type === 'anchor')) {
        const value = language === 'en' ? field.en : field.es;
        for (const element of document.querySelectorAll(mutantContentSelectors[field.id])) setEditableText(element, value);
      }
      if (content.showsEnabled) document.querySelectorAll('.tour-date time').forEach(time => {
        time.textContent = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-MX', {day:'2-digit',month:'short'}).format(new Date(time.dateTime + 'T12:00:00')).toUpperCase();
      });
    };
  } catch (error) { console.warn('Contenido del panel no disponible; se conserva la página.', error.name); }
})();
