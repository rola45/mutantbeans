const encoder = new TextEncoder();
const cookieName = '__Host-mutant-admin';
const flowName = '__Host-mutant-oauth';
const headers = {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://mutantbeans.com blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};
const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const random = () => b64(crypto.getRandomValues(new Uint8Array(32)));
const cookie = (name, value, age) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const readCookie = (request, name) => request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
async function key(env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error('Falta configurar SESSION_SECRET (32 caracteres como mínimo).');
  return crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', encoder.encode(env.SESSION_SECRET)), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function seal(data, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(env), encoder.encode(JSON.stringify(data)));
  return `${b64(iv)}.${b64(new Uint8Array(bytes))}`;
}
async function open(value, env) {
  try {
    const [iv, bytes] = value.split('.');
    const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await key(env), unb64(bytes));
    const data = JSON.parse(new TextDecoder().decode(decoded));
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}
function allowed(login, env) {
  return (env.ALLOWED_GITHUB_USERS || '').split(',').map(v => v.trim().toLowerCase()).includes(login.toLowerCase());
}
async function github(path, token, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options, headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json',
      'User-Agent': 'MutantBeansAdmin', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(response.status === 409 || response.status === 422
    ? 'El contenido cambió. Recarga el panel antes de guardar.' : `GitHub rechazó la operación (${response.status}). Revisa el acceso al repositorio.`);
  return response.json();
}
async function authenticate(request, env) {
  const session = await open(readCookie(request, cookieName) || '', env);
  if (!session || !allowed(session.login, env)) return null;
  // Recheck identity and repository permissions for every API operation.
  const user = await github('/user', session.token);
  if (!user || user.id !== session.id || !allowed(user.login, env)) return null;
  const repo = await github(`/repos/${env.GITHUB_REPO}`, session.token);
  if (!repo?.permissions?.push) return null;
  return session;
}
function validateContent(data, schema) {
  if (!data || data.version !== 1 || !Array.isArray(data.fields) || data.fields.length !== schema.fields.length) throw new Error('Formato de contenido inválido.');
  const used = new Set();
  for (const field of data.fields) {
    const spec = schema.fields.find(v => v.id === field.id);
    if (!spec || used.has(field.id) || field.type !== spec.type) throw new Error('Campo no permitido.');
    used.add(field.id);
    if (spec.type === 'image') {
      if (typeof field.value !== 'string' || !/^(images|imagenes)\/[\w .()\/-]+\.(png|jpg|jpeg|webp)$/i.test(field.value) || field.value.includes('..')) throw new Error('Ruta de imagen inválida.');
    } else if (typeof field.es !== 'string' || typeof field.en !== 'string' || Math.max(field.es.length, field.en.length) > 5000) throw new Error('Texto inválido.');
  }
  if (!Array.isArray(data.shows) || data.shows.length > 100) throw new Error('Lista de shows inválida.');
  for (const show of data.shows) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(show.date) || new Date(show.date + 'T12:00:00Z').toISOString().slice(0, 10) !== show.date) throw new Error('Fecha inválida.');
    for (const name of ['venue', 'city']) if (typeof show[name] !== 'string' || !show[name].trim() || show[name].length > 150) throw new Error('Completa lugar y ciudad.');
  }
  return { version: 1, fields: data.fields.map(field => field.type === 'image'
    ? { id: field.id, type: field.type, value: field.value, enabled: field.enabled === true }
    : { id: field.id, type: field.type, es: field.es, en: field.en, enabled: field.enabled === true }), showsEnabled: data.showsEnabled === true, shows: [...data.shows].sort((a, b) => a.date.localeCompare(b.date)) };
}
async function handler(request, env) {
  const url = new URL(request.url);
  const origin = env.ADMIN_ORIGIN;
  if (url.origin !== origin) return json({ error: 'Dominio del administrador no configurado.' }, 403);
  const callback = `${origin}/auth/callback`;
  if (url.pathname === '/auth/login' && request.method === 'GET') {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return json({ error: 'Configura la aplicación OAuth de GitHub siguiendo admin-worker/README.md.' }, 503);
    const state = random(), verifier = random();
    const challenge = b64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))));
    const target = new URL('https://github.com/login/oauth/authorize');
    target.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: callback, scope: 'public_repo', state, code_challenge: challenge, code_challenge_method: 'S256' });
    return new Response(null, { status: 302, headers: { ...headers, Location: target.href,
      'Set-Cookie': cookie(flowName, await seal({ state, verifier, exp: Date.now() + 600000 }, env), 600) } });
  }
  if (url.pathname === '/auth/callback' && request.method === 'GET') {
    const flow = await open(readCookie(request, flowName) || '', env);
    if (!flow || url.searchParams.get('state') !== flow.state || !url.searchParams.get('code')) return json({ error: 'Solicitud de acceso vencida o inválida. Vuelve a iniciar sesión.' }, 403);
    const result = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: url.searchParams.get('code'), redirect_uri: callback, code_verifier: flow.verifier }) });
    const tokenData = await result.json();
    if (!tokenData.access_token) return json({ error: 'GitHub no autorizó el acceso. Inicia sesión otra vez.' }, 403);
    const user = await github('/user', tokenData.access_token);
    const repo = await github(`/repos/${env.GITHUB_REPO}`, tokenData.access_token);
    if (!allowed(user.login, env) || !repo?.permissions?.push) return json({ error: 'Esta cuenta no está autorizada para administrar Mutant Beans.' }, 403);
    const session = await seal({ login: user.login, id: user.id, token: tokenData.access_token, csrf: random(), exp: Date.now() + 14400000 }, env);
    const responseHeaders = new Headers({ ...headers, Location: '/' });
    responseHeaders.append('Set-Cookie', cookie(cookieName, session, 14400));
    responseHeaders.append('Set-Cookie', cookie(flowName, '', 0));
    return new Response(null, { status: 302, headers: responseHeaders });
  }
  if (url.pathname.startsWith('/api/')) {
    const session = await authenticate(request, env);
    if (!session) return json({ error: 'Inicia sesión con una cuenta autorizada.' }, 401);
    if (request.method !== 'GET' && (request.headers.get('Origin') !== origin || request.headers.get('X-CSRF-Token') !== session.csrf)) return json({ error: 'Solicitud no autorizada.' }, 403);
    const contentPath = `/repos/${env.GITHUB_REPO}/contents/data/site-content.json`;
    if (url.pathname === '/api/session' && request.method === 'GET') return json({ login: session.login, csrf: session.csrf });
    if (url.pathname === '/api/logout' && request.method === 'POST') return new Response('{}', { headers: { ...headers, 'Set-Cookie': cookie(cookieName, '', 0) } });
    if (url.pathname === '/api/content' && request.method === 'GET') {
      const file = await github(`${contentPath}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`, session.token);
      if (!file) return json({ error: 'No se encontró data/site-content.json en GitHub.' }, 404);
      const content = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g, '')), c => c.charCodeAt(0))));
      return json({ content, sha: file.sha });
    }
    if (url.pathname === '/api/content' && request.method === 'PUT') {
      const text = await request.text();
      if (text.length > 200000) return json({ error: 'Contenido demasiado grande.' }, 413);
      const body = JSON.parse(text);
      const schema = await (await env.ASSETS.fetch(new Request(`${origin}/schema.json`))).json();
      const content = validateContent(body.content, schema);
      if (typeof body.sha !== 'string') return json({ error: 'Recarga antes de guardar.' }, 400);
      const bytes = encoder.encode(JSON.stringify(content, null, 2) + '\n');
      const result = await github(contentPath, session.token, { method: 'PUT', body: JSON.stringify({ message: `Update site content by ${session.login}`, branch: env.GITHUB_BRANCH, sha: body.sha, content: btoa(Array.from(bytes, c => String.fromCharCode(c)).join('')) }) });
      return json({ sha: result.content.sha, commit: result.commit.html_url });
    }
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      if (!request.headers.get('Content-Type')?.startsWith('image/')) return json({ error: 'Selecciona PNG, JPG o WebP.' }, 400);
      const bytes = new Uint8Array(await request.arrayBuffer());
      if (!bytes.length || bytes.length > 6 * 1024 * 1024) return json({ error: 'Máximo 6 MB por imagen.' }, 413);
      const png = bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10';
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const webp = new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
      if (!png && !jpg && !webp) return json({ error: 'El archivo no es PNG, JPG o WebP.' }, 400);
      const path = `images/uploads/${crypto.randomUUID()}.${png ? 'png' : jpg ? 'jpg' : 'webp'}`;
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      await github(`/repos/${env.GITHUB_REPO}/contents/${path}`, session.token, { method: 'PUT', body: JSON.stringify({ message: `Upload image by ${session.login}`, branch: env.GITHUB_BRANCH, content: btoa(binary) }) });
      return json({ path });
    }
    return json({ error: 'Ruta no encontrada.' }, 404);
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'Método no permitido.' }, 405);
  const asset = await env.ASSETS.fetch(request);
  const response = new Response(asset.body, asset);
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
}
export default { async fetch(request, env) {
  try { return await handler(request, env); }
  catch (error) { return json({ error: error.message || 'No se pudo completar la operación.' }, 400); }
} };
