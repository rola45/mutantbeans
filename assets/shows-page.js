(() => {
  const list = document.querySelector('[data-show-list]');
  const summary = document.querySelector('[data-show-summary]');
  const status = document.querySelector('[data-show-status]');
  if (!list || !summary || !status) return;

  const spanish = document.documentElement.lang.toLowerCase().startsWith('es');
  const locale = spanish ? 'es-MX' : 'en-US';
  const tijuanaToday = () => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
  };
  const slug = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const escapeIcs = (value) => String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const localDate = (value) => new Date(`${value}T12:00:00Z`);
  const dateKey = (value) => value.replaceAll('-', '');
  const nextDay = (value) => {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10).replaceAll('-', '');
  };
  const makeButton = (label, callback, ariaLabel) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.setAttribute('aria-label', ariaLabel); button.addEventListener('click', callback);
    return button;
  };
  const showDate = (value) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Tijuana' }).format(localDate(value));
  const shareMessage = (show) => `${spanish ? 'Mutant Beans en vivo' : 'Mutant Beans live'} · ${showDate(show.date)} · ${show.venue}, ${show.city}`;

  const render = async () => {
    try {
      const response = await fetch('/data/site-content.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('calendar-unavailable');
      const content = await response.json();
      const today = tijuanaToday();
      const shows = content.showsEnabled && Array.isArray(content.shows)
        ? content.shows.filter((show) => /^\d{4}-\d{2}-\d{2}$/.test(show.date) && show.date >= today && show.venue && show.city).sort((a, b) => a.date.localeCompare(b.date))
        : [];
      list.replaceChildren();
      if (!shows.length) {
        summary.textContent = spanish ? 'No hay fechas anunciadas por ahora.' : 'No dates announced right now.';
        return;
      }
      summary.textContent = spanish ? `${shows.length} ${shows.length === 1 ? 'fecha próxima' : 'fechas próximas'}.` : `${shows.length} upcoming ${shows.length === 1 ? 'show' : 'shows'}.`;
      for (const show of shows) {
        const eventId = `show-${slug(show.date)}-${slug(show.venue)}`;
        const shareUrl = `${location.origin}${location.pathname}#${eventId}`;
        const article = document.createElement('article'); article.className = 'mb-event'; article.id = eventId;
        const time = document.createElement('time'); time.className = 'mb-event-date'; time.dateTime = show.date;
        const shortDate = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', timeZone: 'America/Tijuana' }).format(localDate(show.date)).replace('.', '').toUpperCase();
        time.append(document.createTextNode(shortDate));
        const year = document.createElement('small'); year.textContent = show.date.slice(0, 4); time.append(year);
        const info = document.createElement('div'); info.className = 'mb-event-info';
        const venue = document.createElement('strong'); venue.textContent = show.venue;
        const city = document.createElement('span'); city.textContent = show.city;
        info.append(venue, city);
        const actions = document.createElement('div'); actions.className = 'mb-event-actions';
        const map = document.createElement('a'); map.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${show.venue}, ${show.city}`)}`; map.target = '_blank'; map.rel = 'noopener noreferrer'; map.textContent = spanish ? 'Mapa ↗' : 'Map ↗'; map.setAttribute('aria-label', `${spanish ? 'Abrir mapa de' : 'Open map for'} ${show.venue}, ${show.city}`);
        const contact = document.createElement('a'); contact.href = 'https://www.instagram.com/mutantbeans/'; contact.target = '_blank'; contact.rel = 'noopener noreferrer'; contact.textContent = spanish ? 'Contacto ↗' : 'Contact ↗';
        const share = makeButton(spanish ? 'Compartir' : 'Share', async () => {
          const text = shareMessage(show);
          if (navigator.share) {
            try { await navigator.share({ title: `${show.venue} · Mutant Beans`, text, url: shareUrl }); return; } catch (error) { if (error?.name === 'AbortError') return; }
          }
          try { await navigator.clipboard.writeText(shareUrl); status.textContent = spanish ? 'Enlace del show copiado.' : 'Show link copied.'; }
          catch { status.textContent = spanish ? `Copia este enlace: ${shareUrl}` : `Copy this link: ${shareUrl}`; }
        }, `${spanish ? 'Compartir fecha de' : 'Share'} ${show.venue} · ${showDate(show.date)}`);
        const calendar = makeButton(spanish ? 'Calendario' : 'Calendar', () => {
          const description = `${spanish ? 'Mutant Beans en vivo' : 'Mutant Beans live'} · ${show.city}\n${shareUrl}`;
          const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mutant Beans//Tour Dates//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${slug(`${show.date}-${show.venue}`)}@mutantbeans.com`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,`DTSTART;VALUE=DATE:${dateKey(show.date)}`,`DTEND;VALUE=DATE:${nextDay(show.date)}`,`SUMMARY:${escapeIcs(`Mutant Beans · ${show.venue}`)}`,`LOCATION:${escapeIcs(`${show.venue}, ${show.city}`)}`,`DESCRIPTION:${escapeIcs(description)}`,`URL:${shareUrl}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
          const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
          const downloadUrl = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = downloadUrl; link.download = `${slug(show.date)}-${slug(show.venue)}.ics`; link.click(); setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
          status.textContent = spanish ? 'Archivo de calendario descargado.' : 'Calendar file downloaded.';
        }, `${spanish ? 'Agregar' : 'Add'} ${show.venue} ${spanish ? 'al calendario' : 'to calendar'}`);
        actions.append(map, contact, share, calendar); article.append(time, info, actions); list.append(article);
      }
      if (location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'center' }));
    } catch {
      summary.textContent = spanish ? 'No se pudieron cargar las fechas ahora.' : 'Tour dates could not be loaded right now.';
      const instagram = document.createElement('a'); instagram.href = 'https://www.instagram.com/mutantbeans/'; instagram.target = '_blank'; instagram.rel = 'noopener noreferrer'; instagram.textContent = spanish ? 'Consulta los anuncios en Instagram ↗' : 'Check Instagram for show updates ↗';
      list.replaceChildren(instagram);
    }
  };
  render();
})();
