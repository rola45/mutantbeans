(() => {
  const origin = 'https://mutantbeans.com';
  const slug = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const spanish = (language) => String(language || document.documentElement.lang).toLowerCase().startsWith('es');
  const validShow = (show) => {
    if (!show || !/^\d{4}-\d{2}-\d{2}$/.test(show.date) || typeof show.venue !== 'string' || !show.venue.trim() || typeof show.city !== 'string' || !show.city.trim()) return false;
    const date = new Date(`${show.date}T12:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === show.date;
  };
  const today = () => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tijuana', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
  };
  const eventUrl = (show, language = 'en') => `${origin}${spanish(language) ? '/es/fechas/' : '/shows/'}${validShow(show) ? `#show-${slug(show.date)}-${slug(show.venue)}` : ''}`;
  const announce = (status, message) => {
    if (typeof status === 'function') status(message);
    else if (status) status.textContent = message;
  };
  const share = async (show, { language = document.documentElement.lang, status } = {}) => {
    if (!validShow(show)) return false;
    const es = spanish(language);
    const date = new Intl.DateTimeFormat(es ? 'es-MX' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${show.date}T12:00:00Z`));
    const url = eventUrl(show, language);
    const text = `${es ? 'Mutant Beans en vivo' : 'Mutant Beans live'} · ${date} · ${show.venue}, ${show.city}`;
    if (navigator.share) {
      try { await navigator.share({ title: `${show.venue} · Mutant Beans`, text, url }); return true; }
      catch (error) { if (error?.name === 'AbortError') return false; }
    }
    try {
      await navigator.clipboard.writeText(url);
      announce(status, es ? 'Enlace del show copiado.' : 'Show link copied.');
      return true;
    } catch {
      announce(status, `${es ? 'Copia este enlace' : 'Copy this link'}: ${url}`);
      return false;
    }
  };
  const escapeIcs = (value) => String(value).replace(/\r/g, '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const foldIcsLine = (line) => {
    let length = 0, result = '';
    for (const character of line) {
      const size = new TextEncoder().encode(character).length;
      if (length + size > 75) { result += '\r\n '; length = 1; }
      result += character; length += size;
    }
    return result;
  };
  const downloadCalendar = (show, { language = document.documentElement.lang, status } = {}) => {
    if (!validShow(show)) return false;
    const es = spanish(language);
    const nextDay = new Date(`${show.date}T00:00:00Z`); nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const description = `${es ? 'Mutant Beans en vivo. Horario por confirmar.' : 'Mutant Beans live. Show time to be confirmed.'}\n${eventUrl(show, language)}`;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mutant Beans//Tour Dates//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${slug(`${show.date}-${show.venue}`)}@mutantbeans.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART;VALUE=DATE:${show.date.replaceAll('-', '')}`,
      `DTEND;VALUE=DATE:${nextDay.toISOString().slice(0, 10).replaceAll('-', '')}`,
      `SUMMARY:${escapeIcs(`Mutant Beans · ${show.venue}`)}`, `LOCATION:${escapeIcs(`${show.venue}, ${show.city}`)}`,
      `DESCRIPTION:${escapeIcs(description)}`, `URL:${eventUrl(show, language)}`, 'END:VEVENT', 'END:VCALENDAR'];
    const blob = new Blob([`${lines.map(foldIcsLine).join('\r\n')}\r\n`], { type: 'text/calendar;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = downloadUrl; link.download = `${slug(show.date)}-${slug(show.venue)}.ics`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    announce(status, es ? 'Calendario descargado; horario por confirmar.' : 'Calendar downloaded; show time to be confirmed.');
    return true;
  };
  const publicImage = (image) => {
    try {
      const url = new URL(image || '/og.png', `${origin}/`);
      return url.protocol === 'https:' && !/^(localhost|127\.|\[::1\])/.test(url.hostname) ? url.href : `${origin}/og.png`;
    } catch { return `${origin}/og.png`; }
  };
  const updateSchema = (shows, { language = document.documentElement.lang, image } = {}) => {
    const day = today();
    const dates = Array.isArray(shows) ? shows.filter((show) => validShow(show) && show.date >= day) : [];
    let script = document.getElementById('tour-event-schema');
    if (!dates.length) { script?.remove(); return []; }
    const seen = new Set();
    const events = dates.sort((a, b) => a.date.localeCompare(b.date)).flatMap((show) => {
      const id = eventUrl(show, 'en');
      if (seen.has(id)) return [];
      seen.add(id);
      return [{ '@type': 'MusicEvent', '@id': id, name: spanish(language) ? 'Mutant Beans en vivo' : 'Mutant Beans live',
        startDate: show.date, url: eventUrl(show, language), image: publicImage(image),
        location: { '@type': 'Place', name: show.venue, address: show.city },
        performer: { '@type': 'MusicGroup', '@id': `${origin}/#band`, name: 'Mutant Beans', url: `${origin}/` } }];
    });
    if (!script) { script = document.createElement('script'); script.id = 'tour-event-schema'; script.type = 'application/ld+json'; document.head.append(script); }
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': events });
    return events;
  };
  window.MutantShowTools = { today, eventUrl, share, downloadCalendar, updateSchema };
})();
