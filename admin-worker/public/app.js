let session, content, sha, schema, busy = false, previewSelection = null, activeEditorPlacement = null;
const previewOriginals = new WeakMap();
const visualDocs = new WeakSet();
const draftImageURLs = new Map();
const status = document.querySelector('#status');
const previewFrame = document.querySelector('#site-preview');
const previewTarget = document.querySelector('#preview-target');
const visualControls = document.querySelector('#visual-controls');
function report(message, error = false) { status.textContent = message; status.classList.toggle('error', error); }
function selectPreviewTarget(selector, label, id = '') {
  previewSelection = { selector, label, id };
  highlightPreviewTarget();
}
function restoreActiveEditor() {
  if (!activeEditorPlacement) return;
  const { node, parent, next } = activeEditorPlacement;
  if (next?.parentNode === parent) parent.insertBefore(node, next);
  else parent.append(node);
  activeEditorPlacement = null;
}
function editorNodeFor(id) {
  if (activeEditorPlacement?.id === id) return activeEditorPlacement.node;
  if (id === 'shows') return document.querySelector('#shows-section');
  const field = document.querySelector(`#fields [data-preview-id="${id}"]`);
  return field?.closest('.gallery-editor-card') || field;
}
function selectVisualEditor(id) {
  const label = id === 'shows' ? 'Próximos shows' : schema.fields.find(field => field.id === id)?.label;
  const node = editorNodeFor(id);
  if (!node || !label) return;
  if (activeEditorPlacement?.node !== node) {
    restoreActiveEditor();
    activeEditorPlacement = { id, node, parent: node.parentNode, next: node.nextSibling };
    visualControls.replaceChildren(node);
  }
  const details = node.matches('details') ? node : node.querySelector('details');
  if (details) details.open = true;
  document.querySelector('#selected-module').textContent = label;
  document.querySelector('#selected-hint').textContent = id === 'shows'
    ? 'Edita una fecha; el próximo show del inicio se calculará desde esta lista.'
    : 'Los cambios aparecen en esta vista previa mientras editas. Pulsa “Guardar y publicar” para aplicarlos al sitio.';
  const input = node.querySelector('textarea, input:not([type=checkbox]):not([type=file]), button');
  if (input && input.tagName !== 'BUTTON') input.focus({ preventScroll: true });
}
function selectFromVisualPage(id) {
  if (id === 'shows') {
    selectPreviewTarget('.tour-list', 'Próximos shows', id);
  } else {
    const spec = schema.fields.find(field => field.id === id);
    if (!spec) return;
    selectPreviewTarget(spec.selector, spec.label, id);
  }
  selectVisualEditor(id);
}
function installVisualEditTargets() {
  const doc = previewFrame.contentDocument;
  if (!doc || !schema) return;
  let style = doc.querySelector('#admin-visual-editor-style');
  if (!style) {
    style = doc.createElement('style'); style.id = 'admin-visual-editor-style';
    style.textContent = '.admin-editable-target{cursor:crosshair!important;outline:2px dashed transparent!important;outline-offset:4px!important;transition:outline-color .15s,box-shadow .15s}.admin-editable-target:hover{outline-color:#67f542!important;box-shadow:0 0 0 4px #67f54255!important}.admin-preview-highlight{outline:4px solid #67f542!important;outline-offset:5px!important;box-shadow:0 0 0 8px #67f54266!important;position:relative!important;z-index:20!important;animation:adminPreviewPulse 1.1s ease-in-out infinite alternate!important}@keyframes adminPreviewPulse{from{outline-color:#67f542;box-shadow:0 0 0 4px #67f54233}to{outline-color:#efffe9;box-shadow:0 0 0 9px #67f54288}}';
    doc.head.append(style);
  }
  for (const spec of schema.fields.filter(field => !['page-title', 'favicon'].includes(field.id))) {
    doc.querySelectorAll(spec.selector).forEach(element => element.classList.add('admin-editable-target'));
  }
  doc.querySelectorAll('.tour-date, .next-show, .tour-list').forEach(element => element.classList.add('admin-editable-target'));
  if (visualDocs.has(doc)) return;
  visualDocs.add(doc);
  doc.addEventListener('click', event => {
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    if (!target) return;
    const isShow = target.closest('.tour-date, .next-show, .tour-list');
    const spec = isShow ? null : schema.fields.find(field => !['page-title', 'favicon'].includes(field.id) && target.closest(field.selector));
    if (!isShow && !spec) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    selectFromVisualPage(isShow ? 'shows' : spec.id);
  }, true);
}
function rememberPreviewOriginal(element, read, restore) {
  if (!previewOriginals.has(element)) previewOriginals.set(element, { value: read(), restore });
  return previewOriginals.get(element);
}
function getDraftShows() {
  return [...document.querySelectorAll('.show-row')].map(row => Object.fromEntries(
    [...row.querySelectorAll('input')].map(field => [field.dataset.showField, field.value.trim()])
  ));
}
function previewImageURL(path) {
  if (/^https?:|^blob:/.test(path)) return path;
  return draftImageURLs.get(path) || `https://raw.githubusercontent.com/rola45/mutantbeans/main/${path.split('/').map(encodeURIComponent).join('/')}`;
}
async function refreshPreviewDraft() {
  try {
    const win = previewFrame.contentWindow, doc = previewFrame.contentDocument;
    if (!win || !doc) return;
    await win.mutantContentReady;
    const language = doc.documentElement.lang === 'es' ? 'es' : 'en';
    for (const spec of schema.fields) {
      const field = content.fields.find(value => value.id === spec.id);
      if (!field) continue;
      const element = doc.querySelector(spec.selector);
      if (!element) continue;
      if (field.type === 'text') {
        if (spec.id === 'tour-title') {
          const original = rememberPreviewOriginal(element, () => element.innerHTML, value => { element.innerHTML = value; });
          if (field.enabled) {
            const words = field[language].trim().split(/\s+/).filter(Boolean);
            const accent = doc.createElement('span'); accent.textContent = words.pop() || '';
            element.replaceChildren(doc.createTextNode(words.length ? `${words.join(' ')} ` : ''), accent);
          } else original.restore(original.value);
          continue;
        }
        const original = rememberPreviewOriginal(element, () => element.textContent, value => { element.textContent = value; });
        element.textContent = field.enabled ? field[language] : original.value;
      } else if (element.tagName === 'LINK' && element.id === 'site-favicon') {
        const original = rememberPreviewOriginal(element, () => ({ href: element.getAttribute('href'), type: element.getAttribute('type') }), value => { element.setAttribute('href', value.href); if (value.type) element.setAttribute('type', value.type); });
        const path = field.enabled ? field.value : original.value.href;
        element.setAttribute('href', path);
        element.setAttribute('type', path.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : path.toLowerCase().endsWith('.webp') ? 'image/webp' : path.toLowerCase().endsWith('.jpg') || path.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/png');
      } else {
        const link = element.closest('.gallery-tile, .tour-poster');
        const original = rememberPreviewOriginal(element, () => ({ src: element.getAttribute('src'), link, href: link?.getAttribute('href') }), value => { if (value.src) element.setAttribute('src', value.src); if (value.link && value.href) value.link.setAttribute('href', value.href); });
        const path = field.enabled ? field.value : original.value.src;
        if (path) element.setAttribute('src', previewImageURL(path));
        if (field.enabled && link) link.setAttribute('href', `https://mutantbeans.com/${field.value}`);
        else if (link && original.value.href) link.setAttribute('href', original.value.href);
      }
    }
    const showsList = doc.querySelector('.tour-list');
    if (showsList) {
      const original = rememberPreviewOriginal(showsList, () => showsList.innerHTML, value => { showsList.innerHTML = value; });
      const useDraft = document.querySelector('#shows-enabled').checked;
      if (!useDraft) original.restore(original.value);
      else {
        showsList.replaceChildren();
        for (const show of getDraftShows().filter(value => value.date && value.venue && value.city).sort((a, b) => a.date.localeCompare(b.date))) {
          const article = doc.createElement('article'); article.className = 'tour-date';
          const time = doc.createElement('time'); time.dateTime = show.date;
          time.textContent = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-MX', { day: '2-digit', month: 'short' }).format(new Date(show.date + 'T12:00:00')).toUpperCase();
          const venue = doc.createElement('strong'); venue.textContent = show.venue;
          const city = doc.createElement('span'); city.textContent = show.city;
          const actions = doc.createElement('div'); actions.className = 'tour-actions';
          const map = doc.createElement('a'); map.className = 'tour-map'; map.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(show.venue + ', ' + show.city); map.textContent = language === 'en' ? 'Open map ↗' : 'Abrir mapa ↗'; map.target = '_blank'; map.rel = 'noopener noreferrer';
          const contact = doc.createElement('a'); contact.className = 'tour-contact-link'; contact.href = 'https://www.instagram.com/mutantbeans/'; contact.textContent = language === 'en' ? 'Contact ↗' : 'Contactar ↗'; contact.target = '_blank'; contact.rel = 'noopener noreferrer';
          actions.append(map, contact); article.append(time, venue, city, actions); showsList.append(article);
        }
      }
    }
    installVisualEditTargets();
    highlightPreviewTarget();
  } catch { previewTarget.textContent = 'No se pudieron aplicar los cambios del borrador a la vista previa.'; }
}
function highlightPreviewTarget() {
  try {
    const doc = previewFrame.contentDocument;
    if (!doc || !previewSelection) return;
    doc.querySelectorAll('.admin-preview-highlight').forEach(element => element.classList.remove('admin-preview-highlight'));
    if (previewSelection.id === 'favicon' || previewSelection.id === 'page-title') {
      previewTarget.textContent = `${previewSelection.label}: se muestra en la pestaña del navegador, no dentro del contenido de la página.`;
      return;
    }
    let style = doc.querySelector('#admin-preview-highlight-style');
    if (!style) {
      style = doc.createElement('style'); style.id = 'admin-preview-highlight-style';
      style.textContent = '.admin-preview-highlight{outline:4px solid #67f542!important;outline-offset:5px!important;box-shadow:0 0 0 8px #67f54266!important;position:relative!important;z-index:20!important;animation:adminPreviewPulse 1.1s ease-in-out infinite alternate!important}@keyframes adminPreviewPulse{from{outline-color:#67f542;box-shadow:0 0 0 4px #67f54233}to{outline-color:#efffe9;box-shadow:0 0 0 9px #67f54288}}';
      doc.head.append(style);
    }
    const element = doc.querySelector(previewSelection.selector);
    if (!element) { previewTarget.textContent = `No se encontró «${previewSelection.label}» en la página actual.`; return; }
    element.classList.add('admin-preview-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    previewTarget.textContent = `Resaltado: ${previewSelection.label}`;
  } catch {
    previewTarget.textContent = 'No se pudo cargar la vista previa. Usa “Ver página” para abrirla aparte.';
  }
}
document.querySelector('#preview-open').onclick = async () => {
  const canvas = document.querySelector('.visual-canvas');
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await canvas.requestFullscreen();
  } catch { report('El navegador no pudo ampliar la vista.'); }
};
document.addEventListener('fullscreenchange', () => {
  document.querySelector('#preview-open').textContent = document.fullscreenElement ? 'Salir de pantalla completa' : 'Ampliar página';
});
previewFrame.addEventListener('load', () => refreshPreviewDraft().then(installVisualEditTargets).then(highlightPreviewTarget));
async function api(path, options = {}) {
  const response = await fetch('/admin/api/' + path, { ...options, headers: { 'X-CSRF-Token': session?.csrf || '', ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo guardar.');
  return data;
}
function label(text, input) { const element = document.createElement('label'); element.append(text, input); return element; }
function input(type, value = '') { const element = document.createElement('input'); element.type = type; element.value = value; return element; }
function showRow(show = { date: '', venue: '', city: '' }) {
  const row = document.createElement('div'); row.className = 'show-row';
  for (const [name, title, type] of [['date','Fecha','date'],['venue','Lugar','text'],['city','Ciudad','text']]) {
    const field = input(type, show[name]); field.dataset.showField = name; field.required = true;
    field.addEventListener('input', () => {
      const useShows = document.querySelector('#shows-enabled');
      useShows.checked = true;
      content.showsEnabled = true;
      refreshPreviewDraft();
    });
    row.append(label(title, field));
  }
  const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Quitar'; remove.onclick = () => {
    row.remove();
    const useShows = document.querySelector('#shows-enabled');
    useShows.checked = true;
    content.showsEnabled = true;
    refreshPreviewDraft();
  }; row.append(remove);
  document.querySelector('#shows').append(row);
}
function renderField(spec, container, compact = false) {
  const field = content.fields.find(value => value.id === spec.id);
  if (!field) return;
  const card = compact ? document.createElement('section') : document.createElement('details');
  card.className = compact ? 'gallery-editor-field' : 'card editor-section';
  card.dataset.previewSelector = spec.selector || '';
  card.dataset.previewLabel = spec.label;
  card.dataset.previewId = spec.id;
  card.addEventListener('focusin', () => selectPreviewTarget(card.dataset.previewSelector, card.dataset.previewLabel, card.dataset.previewId));
  if (compact) {
    const heading = document.createElement('h3'); heading.textContent = spec.label.replace(/^Galería · /, ''); card.append(heading);
  } else {
    card.addEventListener('toggle', () => { if (card.open) selectPreviewTarget(card.dataset.previewSelector, card.dataset.previewLabel, card.dataset.previewId); });
    const summary = document.createElement('summary');
    const heading = document.createElement('h2'); heading.textContent = spec.label; summary.append(heading); card.append(summary);
  }
  const body = document.createElement('div'); body.className = compact ? 'gallery-editor-field-body' : 'editor-section-body';
  const enabled = input('checkbox'); enabled.checked = field.enabled === true;
    enabled.onchange = () => { field.enabled = enabled.checked; refreshPreviewDraft(); };
  body.append(label('Usar esta edición ', enabled));
  if (spec.type === 'text') {
    const row = document.createElement('div'); row.className = 'row';
    for (const [lang,title] of [['es','Español'],['en','English']]) {
      const area = document.createElement('textarea'); area.value = field[lang]; area.maxLength = 5000;
        area.oninput = () => { field[lang] = area.value; field.enabled = enabled.checked = true; refreshPreviewDraft(); };
      row.append(label(title, area));
    }
    body.append(row);
  } else {
    const preview = document.createElement('img'); preview.alt = spec.label; preview.src = previewImageURL(field.value);
    const path = input('text', field.value); path.readOnly = true;
    const upload = input('file'); upload.accept = 'image/png,image/jpeg,image/webp';
    upload.onchange = async () => {
      const file = upload.files[0]; if (!file) return;
      if (busy) { report('Espera a que termine la operación actual.'); upload.value = ''; return; }
      if (file.size > 6 * 1024 * 1024) { report('La imagen debe pesar menos de 6 MB.', true); return; }
      busy = true; document.querySelector('#save').disabled = true; upload.disabled = true;
      try {
        report('Subiendo imagen…');
        const data = await api('upload', { method:'POST', headers:{'Content-Type':file.type}, body:file });
        field.value = path.value = data.path; field.enabled = enabled.checked = true;
        const objectURL = URL.createObjectURL(file);
        draftImageURLs.set(data.path, objectURL);
        refreshPreviewDraft();
        preview.src = objectURL;
        report('Imagen subida. Pulsa Guardar y publicar para colocarla en la página.');
      } catch (error) { report(error.message, true); }
      finally { busy = false; document.querySelector('#save').disabled = false; upload.disabled = false; }
    };
    const choose = document.createElement('button'); choose.type = 'button'; choose.textContent = 'Elegir de la biblioteca de Drive';
    choose.onclick = () => openAssetPicker(asset => {
      field.value = path.value = asset.path; field.enabled = enabled.checked = true;
      preview.src = previewImageURL(asset.path);
      refreshPreviewDraft();
      report('Imagen seleccionada. Pulsa Guardar y publicar para colocarla en la página.');
    });
    body.append(preview, choose, label('Archivo actual', path), label('O subir una imagen · máximo 6 MB', upload));
  }
  card.append(body); container.append(card);
}
function renderGallery(container) {
  const section = document.createElement('details'); section.className = 'card editor-section';
  section.dataset.previewSelector = '.gallery-tile:nth-child(1) img'; section.dataset.previewLabel = 'Galería · foto 1';
  section.addEventListener('toggle', () => { if (section.open) selectPreviewTarget(section.dataset.previewSelector, section.dataset.previewLabel); });
  const summary = document.createElement('summary'); const title = document.createElement('h2');
  title.textContent = 'Galería · 7 fotos'; summary.append(title); section.append(summary);
  const body = document.createElement('div'); body.className = 'editor-section-body gallery-editor-grid';
  const photos = schema.fields.filter(spec => /^gallery-\d+$/.test(spec.id));
  for (const photo of photos) {
    const number = photo.id.slice('gallery-'.length);
    const item = document.createElement('section'); item.className = 'gallery-editor-card';
    const caption = schema.fields.find(spec => spec.id === `gallery-caption-${number}`);
    renderField(photo, item, true);
    if (caption) renderField(caption, item, true);
    body.append(item);
  }
  section.append(body); container.append(section);
}
function render() {
  const container = document.querySelector('#fields');
  let galleryRendered = false;
  for (const spec of schema.fields) {
    if (/^gallery-\d+$/.test(spec.id) || /^gallery-caption-\d+$/.test(spec.id)) {
      if (!galleryRendered) { renderGallery(container); galleryRendered = true; }
      continue;
    }
    renderField(spec, container);
  }
  document.querySelector('#shows-enabled').checked = content.showsEnabled === true;
  content.shows.forEach(showRow);
  const showsSection = document.querySelector('#shows-section');
  showsSection.addEventListener('toggle', () => { if (showsSection.open) selectPreviewTarget(showsSection.dataset.previewSelector, showsSection.dataset.previewLabel, 'shows'); });
  showsSection.addEventListener('focusin', () => selectPreviewTarget(showsSection.dataset.previewSelector, showsSection.dataset.previewLabel, 'shows'));
  refreshPreviewDraft();
}
document.querySelector('#add-show').onclick = () => { showRow(); document.querySelector('#shows-enabled').checked = true; };
document.querySelector('#logout').onclick = async () => { try { await api('logout', {method:'POST'}); location.reload(); } catch(error) { report(error.message,true); } };
document.querySelector('#form').onsubmit = async event => {
  event.preventDefault(); if (busy) return;
  busy = true; const button = document.querySelector('#save'); button.disabled = true;
  try {
    content.showsEnabled = document.querySelector('#shows-enabled').checked;
    content.shows = [...document.querySelectorAll('.show-row')].map(row => Object.fromEntries([...row.querySelectorAll('input')].map(field => [field.dataset.showField,field.value.trim()])));
    report('Guardando en GitHub…');
    const result = await api('content', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({content,sha})}); sha = result.sha;
    report('Guardado en GitHub. La publicación en mutantbeans.com puede tardar unos minutos.');
  } catch(error) { report(error.message,true); }
  finally { busy = false; button.disabled = false; }
};
(async () => {
  try {
    session = await api('session');
    const result = await api('content'); content = result.content; sha = result.sha;
    schema = await (await fetch('/admin/schema.json')).json(); render();
    document.querySelector('#account').textContent = 'Conectado como @' + session.login;
    document.querySelector('#login').hidden = true; document.querySelector('#editor').hidden = false;
  } catch(error) { report(error.message); }
})();

let libraryPromise, selectAsset;
const assetDialog = document.querySelector('#asset-picker');
const assetSearch = document.querySelector('#asset-search');
const assetGroup = document.querySelector('#asset-group');
const assetGrid = document.querySelector('#asset-grid');
const assetState = document.querySelector('#asset-state');
async function getLibrary() {
  if (!libraryPromise) libraryPromise = fetch('/admin/asset-library.json', { cache: 'no-cache' }).then(async response => {
    if (!response.ok) throw new Error('No se pudo cargar la biblioteca.');
    const data = await response.json(); return data.assets;
  }).catch(error => { libraryPromise = null; throw error; });
  return libraryPromise;
}
async function renderLibrary() {
  try {
    const assets = await getLibrary();
    const term = assetSearch.value.trim().toLocaleLowerCase();
    const matches = assets.filter(asset => (!assetGroup.value || asset.group === assetGroup.value) && asset.name.toLocaleLowerCase().includes(term));
    assetGrid.replaceChildren(); assetState.textContent = `${matches.length} imágenes disponibles`;
    for (const asset of matches) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'asset-option';
      const image = document.createElement('img'); image.src = 'https://mutantbeans.com/' + asset.path; image.alt = ''; image.loading = 'lazy';
      const title = document.createElement('strong'); title.textContent = asset.name;
      const group = document.createElement('span'); group.textContent = asset.group;
      const role = document.createElement('span'); role.className = asset.role?.includes('capa') ? 'asset-role layer' : 'asset-role'; role.textContent = asset.role || 'Imagen';
      image.onerror = () => { image.hidden = true; const unavailable = document.createElement('span'); unavailable.className = 'asset-unavailable'; unavailable.textContent = 'Vista previa no disponible'; image.after(unavailable); };
      button.append(image,title,group,role); button.onclick = () => {
        if (busy) { assetState.textContent = 'Espera a que termine la operación actual.'; return; }
        if (asset.role?.includes('capa') && !window.confirm(`${asset.name} es una capa suelta (${asset.role}). Al elegirla, la página mostrará solo esa pieza. ¿Quieres usarla?`)) return;
        selectAsset(asset); assetDialog.close();
      }; assetGrid.append(button);
    }
  } catch(error) { assetState.textContent = error.message; }
}
async function openAssetPicker(onSelect) {
  if (busy) { report('Espera a que termine la operación actual.'); return; }
  selectAsset = onSelect; assetDialog.showModal(); assetState.textContent = 'Cargando imágenes…';
  try {
    const assets = await getLibrary();
    if (assetGroup.options.length === 1) for (const name of [...new Set(assets.map(asset => asset.group))]) {
      const option = document.createElement('option'); option.value = option.textContent = name; assetGroup.append(option);
    }
    assetSearch.value = ''; await renderLibrary(); assetSearch.focus();
  } catch(error) { assetState.textContent = error.message; }
}
document.querySelector('#asset-close').onclick = () => assetDialog.close();
assetSearch.oninput = renderLibrary; assetGroup.onchange = renderLibrary;
