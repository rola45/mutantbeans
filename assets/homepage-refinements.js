(() => {
  const header = document.querySelector('.nav');
  const menuButton = header?.querySelector('.menu-toggle');
  const menu = header?.querySelector('.navlinks');
  const mobile = matchMedia('(max-width:900px)');
  const setMenuOpen = (open, restoreFocus = false) => {
    if (!header || !menuButton) return;
    header.dataset.menuOpen = String(open);
    menuButton.setAttribute('aria-expanded', String(open));
    if (restoreFocus) menuButton.focus();
  };
  if (menuButton && menu) {
    header.dataset.menuReady = 'true';
    menuButton.addEventListener('click', () => setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      setMenuOpen(false);
      if (mobile.matches && link.hash && link.pathname === location.pathname) {
        const target = document.getElementById(link.hash.slice(1));
        if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenuOpen(false, true);
    });
    document.addEventListener('click', (event) => { if (!header.contains(event.target)) setMenuOpen(false); });
    mobile.addEventListener('change', () => setMenuOpen(false));
  }

  const tools = window.MutantShowTools;
  const nextActions = document.querySelector('.next-show-tools');
  const calendar = nextActions?.querySelector('[data-show-calendar]');
  const share = nextActions?.querySelector('[data-show-share]');
  const ticket = nextActions?.querySelector('[data-show-ticket]');
  const status = document.querySelector('[data-home-show-status]');
  let nextShow, lastShowState = '';
  const language = () => document.documentElement.lang.startsWith('es') ? 'es' : 'en';
  const refresh = () => {
    if (!tools) return;
    const spanish = language() === 'es';
    const content = window.mutantSiteContent;
    const cards = [...document.querySelectorAll('.tour-date')];
    const shows = cards.map((card) => ({ date: card.querySelector('time')?.dateTime, venue: card.querySelector(':scope > strong')?.textContent, city: card.querySelector(':scope > span')?.textContent }));
    const listedShows = content?.showsEnabled ? content.shows : shows;
    const upcoming = tools.updateSchema(listedShows || [], { language: language(), image: document.querySelector('.tour-poster img')?.getAttribute('src') });
    nextShow = upcoming.length ? (listedShows || []).find((show) => tools.eventUrl(show, 'en') === upcoming[0]['@id']) : undefined;
    const state = `${language()}:${upcoming[0]?.['@id'] || ''}`;
    if (status && state !== lastShowState) status.textContent = '';
    lastShowState = state;
    if (nextActions) nextActions.hidden = !nextShow || !upcoming.length;
    if (calendar) calendar.textContent = spanish ? 'Agregar al calendario' : 'Add to calendar';
    if (share) share.textContent = spanish ? 'Compartir' : 'Share';
    if (ticket) {
      let url;
      try { const parsed = new URL(nextShow?.ticketUrl); if (parsed.protocol === 'https:' && !parsed.username && !parsed.password && !/^(localhost|127\.|\[::1\])/.test(parsed.hostname)) url = parsed.href; } catch {}
      ticket.hidden = !url;
      if (url) { ticket.href = url; ticket.textContent = spanish ? 'Boletos ↗' : 'Tickets ↗'; }
    }
    cards.forEach((card, index) => {
      const show = shows[index];
      let detail = card.querySelector('.tour-detail');
      if (!show.date || show.date < tools.today()) { detail?.remove(); return; }
      if (!detail) { detail = document.createElement('a'); detail.className = 'tour-detail'; card.querySelector('.tour-actions')?.append(detail); }
      const canonical = new URL(tools.eventUrl(show, language()));
      detail.href = canonical.pathname + canonical.hash;
      detail.textContent = spanish ? 'Ver show ↗' : 'Show details ↗';
    });
    const label = document.querySelector('.menu-toggle-label');
    if (label) label.textContent = spanish ? 'Menú' : 'Menu';
  };
  calendar?.addEventListener('click', () => { if (nextShow) tools.downloadCalendar(nextShow, { language: language(), status }); });
  share?.addEventListener('click', () => { if (nextShow) tools.share(nextShow, { language: language(), status }); });
  window.addEventListener('mutant:showsupdated', refresh);
  window.mutantContentReady?.then(refresh);
  refresh();

  if ('IntersectionObserver' in window) {
    document.body.classList.add('motion-visibility-ready');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.toggleAttribute('data-animation-active', entry.isIntersecting)), { rootMargin: '60px' });
    document.querySelectorAll('.member').forEach((member) => observer.observe(member));
  }
})();
