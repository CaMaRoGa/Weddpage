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

## Buscador musical

El backend consulta el iTunes Search API desde `/api/songs` y devuelve:

- título
- artista
- álbum
- carátula
- URL de la previsualización, cuando existe
- URL de la canción en la tienda

La previsualización se reproduce mediante el elemento de audio del navegador y no se
descarga ni se almacena.

Antes de publicar el buscador en una web pública, revisa las condiciones de uso y
atribución de Apple/iTunes aplicables a las previsualizaciones y carátulas.

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

## Importante sobre las previsualizaciones

El proyecto usa el iTunes Search API porque sus resultados de canciones pueden incluir
`previewUrl`, una previsualización de 30 segundos cuando está disponible. Apple indica
que el contenido promocional de su API tiene condiciones específicas de uso y atribución.
