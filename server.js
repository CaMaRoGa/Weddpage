import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const RSVP_FILE = path.join(DATA_DIR, "rsvps.json");

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

async function readRsvps() {
  try {
    const raw = await fs.readFile(RSVP_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeRsvps(items) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(RSVP_FILE, JSON.stringify(items, null, 2), "utf8");
}

// Buscador de canciones: proxy para no exponer/depender de llamadas cross-origin
// desde el navegador. Apple devuelve metadatos y previewUrl para canciones
// cuando hay una previsualización disponible.
app.get("/api/songs", async (req, res) => {
  const term = String(req.query.term || "").trim();

  if (term.length < 2) {
    return res.json({ results: [] });
  }

  if (term.length > 100) {
    return res.status(400).json({ error: "La búsqueda es demasiado larga." });
  }

  try {
    const url = new URL("https://itunes.apple.com/search");
    url.searchParams.set("term", term);
    url.searchParams.set("country", "ES");
    url.searchParams.set("media", "music");
    url.searchParams.set("entity", "song");
    url.searchParams.set("limit", "8");
    url.searchParams.set("lang", "es_es");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`iTunes respondió ${response.status}`);
    }

    const data = await response.json();

    const results = (data.results || []).map((song) => ({
      id: song.trackId,
      title: song.trackName,
      artist: song.artistName,
      album: song.collectionName || "",
      artwork: song.artworkUrl100 || song.artworkUrl60 || "",
      previewUrl: song.previewUrl || null,
      storeUrl: song.trackViewUrl || song.collectionViewUrl || ""
    }));

    res.json({ results });
  } catch (error) {
    console.error("Error buscando canciones:", error);
    res.status(502).json({
      error: "No se han podido buscar canciones ahora mismo."
    });
  }
});

app.post("/api/rsvp", async (req, res) => {
  const body = req.body || {};

  const attending = body.attending === true;
  const name = String(body.name || "").trim();
  const guests = Number(body.guests || 0);
  const allergies = String(body.allergies || "").trim();
  const bus = body.bus === true;
  const songs = Array.isArray(body.songs) ? body.songs.slice(0, 10) : [];

  if (attending && !name) {
    return res.status(400).json({ error: "Indica tu nombre y apellidos." });
  }

  if (attending && (!Number.isInteger(guests) || guests < 1 || guests > 10)) {
    return res.status(400).json({ error: "El número de acompañantes no es válido." });
  }

  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attending,
    name: attending ? name : "",
    guests: attending ? guests : 0,
    allergies: attending ? allergies : "",
    bus: attending ? bus : false,
    songs: attending ? songs : []
  };

  const current = await readRsvps();
  current.push(entry);
  await writeRsvps(current);

  res.json({ ok: true });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Boda María y Carlos: http://localhost:${PORT}`);
});
