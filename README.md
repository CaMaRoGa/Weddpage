# María y Carlos · Web de boda

Proyecto completo para la web de boda del boceto proporcionado.

## Incluye

- Diseño responsive inspirado en el boceto.
- Cabecera de escritorio y menú móvil.
- Formulario de confirmación.
- Número de acompañantes.
- Alergias/intolerancias + opción «Ninguna».
- Autocar.
- Buscador real de canciones.
- Resultados con portada, título y artista.
- Enlace para abrir cada canción en Spotify.
- Botón + para añadir una canción.
- Lista de canciones seleccionadas.
- Límite de 10 canciones por invitado.
- Envío de la confirmación a un backend Express.
- Almacenamiento inicial de confirmaciones en `data/rsvps.json`.

## Requisitos

Node.js 20 o superior.

## Instalación

```bash
npm install
npm start
```

Abre:

```text
http://localhost:3000
```

Durante desarrollo puedes usar:

```bash
npm run dev
```

## Dónde se guardan las confirmaciones

En:

```text
data/rsvps.json
```

Para una boda real conviene sustituir este almacenamiento por una base de datos
(PostgreSQL, MySQL, Supabase, Firebase, etc.) y proteger un panel de administración.

## Música del inicio

La canción «Si Antes Te Hubiera Conocido» de KAROL G se reproduce desde el MP3
local, sin mostrar un reproductor en la página. La web intenta iniciarla al
cargarse y el botón de la esquina superior derecha permite detenerla o volver a
activarla. Algunos navegadores bloquean la reproducción automática con sonido;
en ese caso, pulsa «Activar música».

## Buscador musical de Spotify

El backend consulta la Spotify Web API desde `/api/songs` y devuelve título,
artista, álbum, carátula y enlace a Spotify. El botón de play carga el
reproductor oficial integrado dentro de la página; desde ahí se puede escuchar
la canción sin abrir otra ventana y luego añadirla a la lista.

El servidor usa el flujo Client Credentials. Crea una aplicación en
[Spotify for Developers](https://developer.spotify.com/dashboard), copia
[.env.example](./.env.example) como `.env` en la carpeta del proyecto y completa
el Client ID y el Client Secret:

```env
SPOTIFY_CLIENT_ID=tu-client-id
SPOTIFY_CLIENT_SECRET=tu-client-secret
```

Después reinicia el servidor con `npm start`. El servidor carga `.env`
automáticamente. Si la página sigue mostrando un error, revisa la terminal del
servidor: puede indicar credenciales incorrectas o un problema de conexión con
Spotify.

En producción, añade esas variables a la configuración segura del servicio.
No pongas el secreto en `public/`, en el navegador ni en el repositorio. Si
faltan credenciales, el buscador informa que Spotify no está configurado.
Abre la web desde `http://localhost:3000` con el servidor en marcha; abrir
`public/index.html` directamente no permite al buscador llamar a `/api/songs`.


## Personalización rápida

Los textos principales están en:

```text
public/index.html
```

Los colores, tamaños y distribución están en:

```text
public/styles.css
```

La lógica del buscador/formulario está en:

```text
public/app.js
```

El nombre y fecha de la pareja se pueden cambiar directamente en `index.html`.

## Producción

Para publicar:

1. Sube el proyecto a un servidor que ejecute Node.js.
2. Ejecuta `npm install`.
3. Arranca con `npm start`.
4. Configura un dominio y HTTPS.
5. Sustituye `data/rsvps.json` por una base de datos si habrá muchos invitados.
