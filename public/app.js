const state = {
  selectedSongs: [],
  currentAudio: null,
  currentPreviewId: null,
  searchTimer: null
};

const form = document.getElementById("rsvpForm");
const songSearch = document.getElementById("songSearch");
const songResults = document.getElementById("songResults");
const selectedSongsEl = document.getElementById("selectedSongs");
const selectedCount = document.getElementById("selectedCount");
const clearSongs = document.getElementById("clearSongs");
const clearSearch = document.getElementById("clearSearch");
const toast = document.getElementById("toast");
const successDialog = document.getElementById("successDialog");
const closeDialog = document.getElementById("closeDialog");
const noneAllergies = document.getElementById("noneAllergies");
const allergies = document.getElementById("allergies");
const menuButton = document.getElementById("menuButton");
const mobileNav = document.getElementById("mobileNav");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stopAudio() {
  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio.currentTime = 0;
  }
  state.currentAudio = null;
  state.currentPreviewId = null;
  document.querySelectorAll(".play-button.playing").forEach((button) => {
    button.classList.remove("playing");
    button.textContent = "▶";
  });
}

function playPreview(song, button) {
  if (!song.previewUrl) {
    showToast("Esta canción no tiene previsualización disponible.");
    return;
  }

  if (state.currentPreviewId === song.id && state.currentAudio) {
    stopAudio();
    return;
  }

  stopAudio();

  const audio = new Audio(song.previewUrl);
  audio.preload = "none";
  state.currentAudio = audio;
  state.currentPreviewId = song.id;

  button.classList.add("playing");
  button.textContent = "Ⅱ";

  audio.addEventListener("ended", stopAudio);
  audio.addEventListener("error", () => {
    stopAudio();
    showToast("No se ha podido reproducir la previsualización.");
  });

  audio.play().catch(() => {
    stopAudio();
    showToast("El navegador ha bloqueado la reproducción.");
  });
}

function renderResults(results) {
  if (!results.length) {
    songResults.innerHTML = `<div class="empty-search">No hemos encontrado canciones.</div>`;
    return;
  }

  songResults.innerHTML = results.map((song) => {
    const alreadySelected = state.selectedSongs.some((item) => item.id === song.id);
    return `
      <div class="song-row">
        <img class="album-art" src="${escapeHtml(song.artwork)}" alt="" loading="lazy">
        <div class="song-info">
          <div class="song-title">${escapeHtml(song.title)}</div>
          <div class="song-artist">${escapeHtml(song.artist)}</div>
        </div>
        <button
          type="button"
          class="icon-button play-button"
          data-action="play"
          data-id="${escapeHtml(song.id)}"
          aria-label="Reproducir previsualización de ${escapeHtml(song.title)}"
          ${song.previewUrl ? "" : "disabled"}
        >▶</button>
        <button
          type="button"
          class="icon-button plus-button"
          data-action="add"
          data-id="${escapeHtml(song.id)}"
          aria-label="${alreadySelected ? "Canción ya seleccionada" : "Añadir canción"}"
          ${alreadySelected ? "disabled" : ""}
        >${alreadySelected ? "✓" : "+"}</button>
      </div>
    `;
  }).join("");

  // Guardamos temporalmente los resultados en los botones para poder recuperar el objeto.
  songResults.querySelectorAll("[data-action]").forEach((button) => {
    const song = results.find((item) => String(item.id) === String(button.dataset.id));
    button._song = song;
  });
}

async function searchSongs(term) {
  if (term.trim().length < 2) {
    songResults.innerHTML = `<div class="empty-search">Empieza a escribir para buscar una canción.</div>`;
    clearSearch.style.display = term ? "block" : "none";
    return;
  }

  songResults.innerHTML = `<div class="empty-search">Buscando canciones...</div>`;

  try {
    const response = await fetch(`/api/songs?term=${encodeURIComponent(term.trim())}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Error de búsqueda");
    renderResults(data.results || []);
  } catch (error) {
    console.error(error);
    songResults.innerHTML = `<div class="empty-search">No se ha podido realizar la búsqueda.</div>`;
  }
}

function addSong(song) {
  if (!song || state.selectedSongs.some((item) => item.id === song.id)) return;

  if (state.selectedSongs.length >= 10) {
    showToast("Puedes seleccionar como máximo 10 canciones.");
    return;
  }

  state.selectedSongs.push(song);
  renderSelectedSongs();
  // Actualiza los resultados visibles para marcar la canción como seleccionada.
  const term = songSearch.value.trim();
  if (term.length >= 2) searchSongs(term);
}

function removeSong(id) {
  state.selectedSongs = state.selectedSongs.filter((song) => String(song.id) !== String(id));
  renderSelectedSongs();

  const term = songSearch.value.trim();
  if (term.length >= 2) searchSongs(term);
}

function renderSelectedSongs() {
  selectedCount.textContent = state.selectedSongs.length;

  if (!state.selectedSongs.length) {
    selectedSongsEl.innerHTML = `<div class="empty-selected">Todavía no has seleccionado ninguna.</div>`;
    return;
  }

  selectedSongsEl.innerHTML = state.selectedSongs.map((song) => `
    <div class="selected-song">
      <img class="album-art" src="${escapeHtml(song.artwork)}" alt="" loading="lazy">
      <div class="song-info">
        <div class="song-title">${escapeHtml(song.title)}</div>
        <div class="song-artist">${escapeHtml(song.artist)}</div>
      </div>
      <button
        type="button"
        class="remove-song"
        data-remove-id="${escapeHtml(song.id)}"
        aria-label="Eliminar ${escapeHtml(song.title)}"
      >×</button>
    </div>
  `).join("");
}

songSearch.addEventListener("input", () => {
  const term = songSearch.value;
  clearSearch.style.display = term ? "block" : "none";

  window.clearTimeout(state.searchTimer);
  state.searchTimer = window.setTimeout(() => searchSongs(term), 280);
});

clearSearch.addEventListener("click", () => {
  songSearch.value = "";
  clearSearch.style.display = "none";
  stopAudio();
  songResults.innerHTML = `<div class="empty-search">Empieza a escribir para buscar una canción.</div>`;
  songSearch.focus();
});

songResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || !button._song) return;

  if (button.dataset.action === "play") {
    playPreview(button._song, button);
  }

  if (button.dataset.action === "add") {
    addSong(button._song);
  }
});

selectedSongsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-id]");
  if (!button) return;
  removeSong(button.dataset.removeId);
});

clearSongs.addEventListener("click", () => {
  state.selectedSongs = [];
  renderSelectedSongs();
  const term = songSearch.value.trim();
  if (term.length >= 2) searchSongs(term);
});

noneAllergies.addEventListener("change", () => {
  if (noneAllergies.checked) {
    allergies.value = "";
    allergies.disabled = true;
  } else {
    allergies.disabled = false;
  }
});

document.querySelectorAll('input[name="attending"], input[name="bus"]').forEach((input) => {
  input.addEventListener("change", (event) => {
    document.querySelectorAll(`input[name="${event.target.name}"]`).forEach((radio) => {
      radio.closest(".choice")?.classList.toggle("active", radio.checked);
    });

    if (event.target.name === "attending") {
      const isAttending = event.target.value === "yes";
      document.querySelectorAll("#name, #guests, #allergies, #noneAllergies, input[name='bus'], #songSearch, #clearSongs")
        .forEach((el) => { el.disabled = !isAttending; });
    }
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const attending = document.querySelector('input[name="attending"]:checked')?.value === "yes";
  const bus = document.querySelector('input[name="bus"]:checked')?.value === "yes";

  if (attending && !document.getElementById("name").value.trim()) {
    showToast("Por favor, indica tu nombre y apellidos.");
    document.getElementById("name").focus();
    return;
  }

  const payload = {
    attending,
    name: document.getElementById("name").value.trim(),
    guests: Number(document.getElementById("guests").value),
    allergies: noneAllergies.checked ? "Ninguna" : allergies.value.trim(),
    bus,
    songs: state.selectedSongs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      artwork: song.artwork,
      storeUrl: song.storeUrl
    }))
  };

  const submitButton = form.querySelector(".submit-button");
  const original = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = "<span>ENVIANDO...</span>";

  try {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "No se pudo enviar");

    stopAudio();
    successDialog.showModal();
  } catch (error) {
    console.error(error);
    showToast(error.message || "No se ha podido enviar la confirmación.");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = original;
  }
});

closeDialog.addEventListener("click", () => successDialog.close());

menuButton.addEventListener("click", () => {
  const open = mobileNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

mobileNav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    mobileNav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});

renderSelectedSongs();
