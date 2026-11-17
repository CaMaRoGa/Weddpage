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

## Buscador musical de Spotify

El backend consulta la Spotify Web API desde `/api/songs` y devuelve título,
artista, álbum, carátula y enlace a Spotify. Las canciones se buscan en el
catálogo de España y se pueden abrir en Spotify; la API no ofrece una
previsualización reproducible para todos los resultados.

El servidor usa el flujo Client Credentials. Crea una aplicación en
[Spotify for Developers](https://developer.spotify.com/dashboard) y configura
sus credenciales como variables de entorno. En PowerShell:

```powershell
$env:SPOTIFY_CLIENT_ID = "tu-client-id"
$env:SPOTIFY_CLIENT_SECRET = "tu-client-secret"
npm start
```

En producción, añade esas variables a la configuración segura del servicio.
No pongas el secreto en `public/`, en el navegador ni en el repositorio. Si
faltan credenciales, el buscador informa que Spotify no está configurado.


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

