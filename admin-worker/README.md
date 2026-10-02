# Administrador de Mutant Beans

Panel separado para el Worker `mutantbeans.rolandovictorio.workers.dev`.
La página pública continúa en GitHub Pages. No requiere Cloudflare Zero Trust.

## 1. Registrar el acceso con GitHub

Abre https://github.com/settings/applications/new e introduce:

- Application name: `Mutant Beans Admin`
- Homepage URL: `https://mutantbeans.rolandovictorio.workers.dev`
- Authorization callback URL: `https://mutantbeans.rolandovictorio.workers.dev/auth/callback`

Registra la aplicación y genera un Client Secret. Guarda estos datos directamente
como secretos del Worker, nunca en el repositorio ni en un mensaje de chat:

- `GITHUB_CLIENT_ID`: Client ID de la aplicación.
- `GITHUB_CLIENT_SECRET`: Client Secret generado.
- `SESSION_SECRET`: valor aleatorio de al menos 32 caracteres, distinto del secreto de GitHub.
  Puedes generar uno con `openssl rand -hex 32`.

En Cloudflare: Workers & Pages → mutantbeans → Settings → Variables and Secrets.
Selecciona el tipo Secret para los tres valores.

La app solicita `public_repo` para guardar cambios en el repositorio público.
GitHub concede ese alcance sobre los repositorios públicos accesibles de la cuenta;
el servidor de este panel limita las operaciones a `rola45/mutantbeans`.

## 2. Publicar el Worker

Desde la carpeta `admin-worker`, con Node.js instalado:

```sh
npx wrangler login
npx wrangler deploy
```

Wrangler publica `public/` y `src/worker.js` en el Worker existente llamado
`mutantbeans`. Los secretos configurados en Cloudflare se mantienen.
También se pueden configurar después de iniciar sesión:

```sh
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
```

Introduce cada valor cuando el comando lo solicite. No lo escribas como argumento.

## 3. Usuarios autorizados

Inicialmente únicamente `rola45`. Edita `ALLOWED_GITHUB_USERS` en
`wrangler.jsonc` para añadir otros nombres, separados por comas, y vuelve a
publicar. Cada usuario necesita además permiso de escritura en el repositorio.
No basta con conocer la URL o tener una cuenta de GitHub.

## 4. Uso del panel

1. Abre la dirección del Worker y entra con GitHub.
2. Edita los campos deseados; textos en español y en inglés.
3. Sube imágenes PNG/JPG/WebP de máximo 6 MB.
4. Edita fechas, lugar y ciudad. Activa «Usar estas fechas» para reemplazar el calendario.
5. Pulsa «Guardar y publicar». El panel guarda `data/site-content.json` en `main`.

Las imágenes se suben a `images/uploads/` en un commit propio. Hasta guardar el
contenido no se colocan en la página. Los originales se conservan. GitHub Pages
publica los commits según la configuración del repositorio; no es instantáneo.
Si otro usuario modifica el mismo contenido, recarga antes de guardar para evitar
sobrescribirlo. Los cambios aún no guardados se perderán al recargar.

Los campos desactivados siguen usando el HTML original. Activar el calendario lo
convierte en la fuente de las fechas y del próximo show; cualquier automatización
que actualice shows deberá editar este JSON, no las fechas del HTML.

El panel permite reemplazar las siete fotos existentes del carrusel, el logo,
la imagen de inicio, la mascota de historia, el flyer y algunos textos principales.
Agregar nuevas posiciones al carrusel o editar poses animadas requiere ampliar el
esquema. No se implementó un editor de HTML libre.

## Seguridad y estado

OAuth con state y PKCE; sesión cifrada en cookie HttpOnly/Secure de cuatro horas;
comprobación de cuenta y permisos de GitHub en cada llamada; protección CSRF en
escrituras. El token de GitHub permanece en una cookie cifrada, no en localStorage
ni en JavaScript del navegador. HTTPS es obligatorio para la sesión.

Cerrar sesión elimina la cookie local. Para revocar el permiso de la aplicación,
usa GitHub → Settings → Applications → Authorized OAuth Apps.

Los archivos están preparados. El login y la escritura reales necesitan los
secretos y el despliegue; no se han probado contra una OAuth App configurada.

Si se cambia posteriormente a `admin.mutantbeans.com`, actualizar ADMIN_ORIGIN y
las dos URLs de la OAuth App. Los Custom Domains de Workers necesitan una zona
activa de Cloudflare; un CNAME en GoDaddy a workers.dev no sustituye ese requisito.

Documentación:
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/configuration/secrets/
