(() => {
  const list = document.querySelector('[data-show-list]');
  const summary = document.querySelector('[data-show-summary]');
  const status = document.querySelector('[data-show-status]');
  const tools = window.MutantShowTools;
  if (!list || !summary || !status || !tools) return;

  const language = document.documentElement.lang;
  const spanish = language.toLowerCase().startsWith('es');
  const locale = spanish ? 'es-MX' : 'en-US';
  const localDate = (value) => new Date(`${value}T12:00:00Z`);
  const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(localDate(value).valueOf()) && localDate(value).toISOString().slice(0, 10) === value;
  const makeButton = (label, callback, ariaLabel) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.setAttribute('aria-label', ariaLabel); button.addEventListener('click', callback);
    return button;
  };
  const showDate = (value) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(localDate(value));
  const ticketLink = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password && !/^(localhost|127\.|\[::1\])/.test(url.hostname) ? url.href : '';
    } catch { return ''; }
  };
  let renderedDay = '', loading = false;
  const render = async () => {
    if (loading) return;
    loading = true;
    try {
      const response = await fetch('/data/site-content.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('calendar-unavailable');
      const content = await response.json();
      const today = tools.today();
      const shows = content.showsEnabled && Array.isArray(content.shows)
        ? content.shows.filter((show) => show && validDate(show.date) && show.date >= today && typeof show.venue === 'string' && show.venue.trim() && typeof show.city === 'string' && show.city.trim()).sort((a, b) => a.date.localeCompare(b.date))
        : [];
      tools.updateSchema(shows, { language });
      renderedDay = today;
      list.replaceChildren();
      if (!shows.length) {
        summary.textContent = spanish ? 'No hay fechas anunciadas por ahora.' : 'No dates announced right now.';
        return;
      }
      summary.textContent = spanish ? `${shows.length} ${shows.length === 1 ? 'fecha próxima' : 'fechas próximas'}.` : `${shows.length} upcoming ${shows.length === 1 ? 'show' : 'shows'}.`;
      for (const show of shows) {
        const eventId = new URL(tools.eventUrl(show, language)).hash.slice(1);
        const article = document.createElement('article'); article.className = 'mb-event'; article.id = eventId;
        const time = document.createElement('time'); time.className = 'mb-event-date'; time.dateTime = show.date;
        const shortDate = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(localDate(show.date)).replace('.', '').toUpperCase();
        time.append(document.createTextNode(shortDate));
        const year = document.createElement('small'); year.textContent = show.date.slice(0, 4); time.append(year);
        const info = document.createElement('div'); info.className = 'mb-event-info';
        const venue = document.createElement('strong'); venue.textContent = show.venue;
        const city = document.createElement('span'); city.textContent = show.city;
        info.append(venue, city);
        const actions = document.createElement('div'); actions.className = 'mb-event-actions';
        const map = document.createElement('a'); map.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${show.venue}, ${show.city}`)}`; map.target = '_blank'; map.rel = 'noopener noreferrer'; map.textContent = spanish ? 'Mapa ↗' : 'Map ↗'; map.setAttribute('aria-label', `${spanish ? 'Abrir mapa de' : 'Open map for'} ${show.venue}, ${show.city}`);
        const contact = document.createElement('a'); contact.href = 'https://www.instagram.com/mutantbeans/'; contact.target = '_blank'; contact.rel = 'noopener noreferrer'; contact.textContent = spanish ? 'Contacto ↗' : 'Contact ↗';
        const share = makeButton(spanish ? 'Compartir' : 'Share', () => tools.share(show, { language, status }), `${spanish ? 'Compartir fecha de' : 'Share'} ${show.venue} · ${showDate(show.date)}`);
        const calendar = makeButton(spanish ? 'Calendario' : 'Calendar', () => tools.downloadCalendar(show, { language, status }), `${spanish ? 'Agregar' : 'Add'} ${show.venue} ${spanish ? 'al calendario' : 'to calendar'}`);
        const ticketUrl = ticketLink(show.ticketUrl);
        if (ticketUrl) {
          const tickets = document.createElement('a'); tickets.href = ticketUrl; tickets.target = '_blank'; tickets.rel = 'noopener noreferrer'; tickets.textContent = spanish ? 'Boletos ↗' : 'Tickets ↗';
          tickets.setAttribute('aria-label', `${spanish ? 'Boletos para' : 'Tickets for'} ${show.venue} · ${showDate(show.date)}`); actions.append(tickets);
        }
        actions.append(map, contact, share, calendar); article.append(time, info, actions); list.append(article);
      }
      if (location.hash) {
        try { const eventId = decodeURIComponent(location.hash.slice(1)); requestAnimationFrame(() => document.getElementById(eventId)?.scrollIntoView({ block: 'center' })); } catch { /* Ignore malformed incoming anchors. */ }
      }
    } catch {
      tools.updateSchema([]);
      summary.textContent = spanish ? 'No se pudieron cargar las fechas ahora.' : 'Tour dates could not be loaded right now.';
      const instagram = document.createElement('a'); instagram.href = 'https://www.instagram.com/mutantbeans/'; instagram.target = '_blank'; instagram.rel = 'noopener noreferrer'; instagram.textContent = spanish ? 'Consulta los anuncios en Instagram ↗' : 'Check Instagram for show updates ↗';
      list.replaceChildren(instagram);
    } finally { loading = false; }
  };
  render();
  const refreshDate = () => { if (renderedDay !== tools.today()) render(); };
  setInterval(refreshDate, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDate(); });
})();
