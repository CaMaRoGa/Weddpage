const state = {
  selectedSongs: [],
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
const guests = document.getElementById("guests");
const companionFields = document.getElementById("companionFields");
const attendeeFieldsLeft = document.getElementById("attendeeFieldsLeft");
const attendeeFieldsRight = document.getElementById("attendeeFieldsRight");
const preweddingDetails = document.getElementById("preweddingDetails");
const preweddingNameField = document.getElementById("preweddingNameField");
const preweddingName = document.getElementById("preweddingName");
const preweddingCount = document.getElementById("preweddingCount");
const busDetails = document.getElementById("busDetails");
const busPickup = document.getElementById("busPickup");
const busDropoff = document.getElementById("busDropoff");
const menuButton = document.getElementById("menuButton");
const mobileNav = document.getElementById("mobileNav");
const musicToggle = document.getElementById("musicToggle");
const backgroundAudio = document.getElementById("backgroundAudio");
const spotifyPreview = document.getElementById("spotifyPreview");
const spotifyPreviewStatus = document.getElementById("spotifyPreviewStatus");
const spotifyPreviewMount = document.getElementById("spotifyPreviewMount");
let spotifyIframeApi = null;
let spotifyEmbedController = null;
let activeSpotifyTrackId = null;
let spotifyEmbedPlaying = false;
let pendingSpotifySong = null;
let spotifyIframeApiFailed = false;
let backgroundAudioPlaying = false;

function updateMusicToggle(isPlaying) {
  backgroundAudioPlaying = isPlaying;
  musicToggle.textContent = isPlaying ? "Desactivar música" : "Activar música";
  musicToggle.setAttribute("aria-label", isPlaying ? "Desactivar música" : "Activar música");
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
}

async function playBackgroundAudio() {
  try {
    await backgroundAudio.play();
  } catch (error) {
    updateMusicToggle(false);
    if (error.name === "NotAllowedError") {
      showToast("El navegador bloqueó la reproducción automática. Pulsa «Activar música» para escucharla.");
      return;
    }

    console.error("No se pudo reproducir el archivo de música:", error);
    showToast("No se ha podido reproducir la canción.");
  }
}

musicToggle.addEventListener("click", () => {
  stopSongPreview();
  if (backgroundAudioPlaying) {
    backgroundAudio.pause();
  } else {
    void playBackgroundAudio();
  }
});

backgroundAudio.addEventListener("playing", () => updateMusicToggle(true));
backgroundAudio.addEventListener("pause", () => updateMusicToggle(false));

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

function renderResults(results) {
  stopSongPreview();

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
          class="icon-button preview-button"
          data-action="preview"
          data-id="${escapeHtml(song.id)}"
          title="Reproducir en esta página"
          aria-label="Reproducir ${escapeHtml(song.title)} en esta página"
          aria-pressed="false"
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

  songResults.querySelectorAll("[data-action]").forEach((button) => {
    const song = results.find((item) => String(item.id) === String(button.dataset.id));
    button._song = song;
  });
}

function updatePreviewButtons() {
  songResults.querySelectorAll('[data-action="preview"]').forEach((button) => {
    const song = button._song;
    const isPlaying = song && String(song.id) === String(activeSpotifyTrackId) && spotifyEmbedPlaying;
    button.textContent = isPlaying ? "Ⅱ" : "▶";
    button.setAttribute("aria-label", isPlaying
      ? `Pausar ${song.title} en esta página`
      : `Reproducir ${song.title} en esta página`);
    button.setAttribute("aria-pressed", String(isPlaying));
    button.title = isPlaying ? "Pausar reproducción" : "Reproducir en esta página";
  });
}

function stopSongPreview() {
  pendingSpotifySong = null;
  activeSpotifyTrackId = null;
  spotifyEmbedPlaying = false;
  spotifyPreview.hidden = true;
  spotifyPreviewStatus.hidden = true;
  if (spotifyEmbedController) spotifyEmbedController.pause();
  updatePreviewButtons();
}

function createSpotifyEmbed(song) {
  spotifyPreviewStatus.hidden = true;
  spotifyIframeApi.createController(
    spotifyPreviewMount,
    { uri: `spotify:track:${song.id}`, width: "100%", height: "152" },
    (controller) => {
      spotifyEmbedController = controller;
      controller.addListener("playback_started", (event) => {
        const trackId = event.data.playingURI?.split(":").pop();
        if (trackId) activeSpotifyTrackId = trackId;
        spotifyEmbedPlaying = true;
        updatePreviewButtons();
      });
      controller.addListener("playback_update", (event) => {
        const trackId = event.data.playingURI?.split(":").pop();
        if (trackId) activeSpotifyTrackId = trackId;
        spotifyEmbedPlaying = !event.data.isPaused;
        updatePreviewButtons();
      });
      controller.addListener("ready", () => {
        if (String(activeSpotifyTrackId) === String(song.id)) controller.play();
      });
    }
  );
}

function toggleSongPreview(song) {
  spotifyPreview.hidden = false;
  if (!backgroundAudio.paused) backgroundAudio.pause();

  if (spotifyIframeApiFailed) {
    spotifyPreviewStatus.textContent = "No se ha podido cargar el reproductor integrado de Spotify.";
    spotifyPreviewStatus.hidden = false;
    showToast("No se ha podido cargar el reproductor de Spotify. Inténtalo de nuevo más tarde.");
    return;
  }

  if (spotifyEmbedController && String(song.id) === String(activeSpotifyTrackId)) {
    spotifyEmbedController.togglePlay();
    return;
  }

  activeSpotifyTrackId = String(song.id);
  spotifyEmbedPlaying = false;
  updatePreviewButtons();

  if (!spotifyIframeApi) {
    pendingSpotifySong = song;
    spotifyPreviewStatus.textContent = "Cargando el reproductor de Spotify…";
    spotifyPreviewStatus.hidden = false;
    return;
  }

  try {
    if (spotifyEmbedController) {
      spotifyEmbedController.loadEntity(song.spotifyUrl);
      spotifyEmbedController.play();
    } else {
      createSpotifyEmbed(song);
    }
  } catch (error) {
    console.error("No se pudo iniciar el reproductor integrado de Spotify:", error);
    spotifyPreviewStatus.textContent = "No se ha podido reproducir esta canción dentro de la página.";
    spotifyPreviewStatus.hidden = false;
    showToast("No se ha podido iniciar la reproducción en Spotify.");
  }
}

window.onSpotifyIframeApiReady = (api) => {
  spotifyIframeApi = api;
  if (pendingSpotifySong) {
    const song = pendingSpotifySong;
    pendingSpotifySong = null;
    createSpotifyEmbed(song);
  }
};

const spotifyIframeApiScript = document.createElement("script");
spotifyIframeApiScript.src = "https://open.spotify.com/embed/iframe-api/v1";
spotifyIframeApiScript.async = true;
spotifyIframeApiScript.onerror = () => {
  spotifyIframeApiFailed = true;
  console.error("No se pudo cargar la API del reproductor integrado de Spotify.");
  if (pendingSpotifySong) {
    pendingSpotifySong = null;
    spotifyPreviewStatus.textContent = "No se ha podido cargar el reproductor integrado de Spotify.";
    spotifyPreviewStatus.hidden = false;
  }
};
document.head.append(spotifyIframeApiScript);

async function searchSongs(term) {
  stopSongPreview();

  if (term.trim().length < 2) {
    songResults.innerHTML = `<div class="empty-search">Empieza a escribir para buscar una canción.</div>`;
    clearSearch.style.display = term ? "block" : "none";
    return;
  }

  if (window.location.protocol === "file:") {
    songResults.innerHTML = `<div class="empty-search">Abre la web desde http://localhost:3000 (con el servidor iniciado), no desde index.html.</div>`;
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
    const message = error instanceof TypeError
      ? "No se ha podido conectar con el servidor de la web. Comprueba que esté iniciado."
      : error.message || "No se ha podido realizar la búsqueda.";
    songResults.innerHTML = `<div class="empty-search">${escapeHtml(message)}</div>`;
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
  void playBackgroundAudio();
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

function renderCompanionFields() {
  const previousCompanions = Array.from(companionFields.querySelectorAll(".companion-entry")).map((entry) => ({
    name: entry.querySelector("[data-companion-name]").value,
    allergies: entry.querySelector("[data-companion-allergies]").value,
    noAllergies: entry.querySelector("[data-companion-none]").checked
  }));
  const count = Number(guests.value);

  companionFields.innerHTML = Array.from({ length: count }, (_, index) => {
    const companion = previousCompanions[index] || { name: "", allergies: "" };
    return `
      <div class="companion-entry">
        <h3>Acompañante ${index + 1}</h3>
        <label for="companionName${index}">Nombre y apellidos</label>
        <input id="companionName${index}" type="text" data-companion-name required placeholder="Nombre completo">
        <label class="companion-allergies" for="companionAllergies${index}">Alergias o intolerancias</label>
        <label class="checkline">
          <input type="checkbox" data-companion-none>
          <span class="box"></span> Ninguna
        </label>
        <textarea id="companionAllergies${index}" data-companion-allergies rows="3" placeholder="Indica cualquier alergia o intolerancia alimentaria..."></textarea>
      </div>
    `;
  }).join("");

  Array.from(companionFields.querySelectorAll(".companion-entry")).forEach((entry, index) => {
    entry.querySelector("[data-companion-name]").value = previousCompanions[index]?.name || "";
    entry.querySelector("[data-companion-allergies]").value = previousCompanions[index]?.allergies || "";
    const noAllergies = entry.querySelector("[data-companion-none]");
    noAllergies.checked = previousCompanions[index]?.noAllergies || false;
    entry.querySelector("[data-companion-allergies]").disabled = noAllergies.checked;
  });
}

function updateAttendanceDetails() {
  const isAttending = document.querySelector('input[name="attending"]:checked')?.value === "yes";
  attendeeFieldsLeft.hidden = !isAttending;
  attendeeFieldsRight.hidden = !isAttending;

  form.querySelectorAll("#name, #guests, #allergies, #noneAllergies, input[name='bus'], #busPickup, #busDropoff, #songSearch, #clearSearch, #clearSongs, [data-companion-name], [data-companion-allergies], [data-companion-none]")
    .forEach((element) => { element.disabled = !isAttending; });
  allergies.disabled = !isAttending || noneAllergies.checked;
  companionFields.querySelectorAll(".companion-entry").forEach((entry) => {
    const noAllergies = entry.querySelector("[data-companion-none]").checked;
    entry.querySelector("[data-companion-allergies]").disabled = !isAttending || noAllergies;
  });
}

function updatePreweddingDetails() {
  const isAttending = document.querySelector('input[name="attending"]:checked')?.value === "yes";
  const wantsPrewedding = document.querySelector('input[name="prewedding"]:checked')?.value === "yes";
  const needsPreweddingName = !isAttending;

  preweddingDetails.hidden = !wantsPrewedding;
  preweddingCount.disabled = !wantsPrewedding;
  preweddingCount.required = wantsPrewedding;
  preweddingNameField.hidden = !needsPreweddingName;
  preweddingName.disabled = !needsPreweddingName;
  preweddingName.required = needsPreweddingName;
  if (!wantsPrewedding) preweddingCount.value = "";
  if (!needsPreweddingName) preweddingName.value = "";
}

function updateBusDetails() {
  const isAttending = document.querySelector('input[name="attending"]:checked')?.value === "yes";
  const usesBus = document.querySelector('input[name="bus"]:checked')?.value === "yes";
  const showDetails = isAttending && usesBus;

  busDetails.hidden = !showDetails;
  [busPickup, busDropoff].forEach((select) => {
    select.disabled = !showDetails;
    select.required = showDetails;
  });
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
  songResults.innerHTML = `<div class="empty-search">Empieza a escribir para buscar una canción.</div>`;
  songSearch.focus();
});

songResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button?._song) return;
  if (button.dataset.action === "add") addSong(button._song);
  if (button.dataset.action === "preview") toggleSongPreview(button._song);
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

guests.addEventListener("change", renderCompanionFields);

companionFields.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-companion-none]");
  if (!checkbox) return;

  const allergiesInput = checkbox.closest(".companion-entry").querySelector("[data-companion-allergies]");
  if (checkbox.checked) allergiesInput.value = "";
  allergiesInput.disabled = checkbox.checked;
});

noneAllergies.addEventListener("change", () => {
  if (noneAllergies.checked) {
    allergies.value = "";
    allergies.disabled = true;
  } else {
    allergies.disabled = false;
  }
});

document.querySelectorAll('input[name="attending"], input[name="bus"], input[name="prewedding"]').forEach((input) => {
  input.addEventListener("change", (event) => {
    document.querySelectorAll(`input[name="${event.target.name}"]`).forEach((radio) => {
      radio.closest(".choice")?.classList.toggle("active", radio.checked);
    });

    updateAttendanceDetails();
    updatePreweddingDetails();
    updateBusDetails();
    if (event.target.name === "bus" && event.target.value === "no") {
      busPickup.value = "";
      busDropoff.value = "";
    }
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const attending = document.querySelector('input[name="attending"]:checked')?.value === "yes";
  const bus = attending && document.querySelector('input[name="bus"]:checked')?.value === "yes";
  const wantsPrewedding = document.querySelector('input[name="prewedding"]:checked')?.value === "yes";
  const respondentName = attending
    ? document.getElementById("name").value.trim()
    : preweddingName.value.trim();

  if (!respondentName) {
    showToast("Por favor, indica tu nombre y apellidos.");
    (attending ? document.getElementById("name") : preweddingName).focus();
    return;
  }

  if (wantsPrewedding && !preweddingCount.value) {
    showToast("Indica cuántas personas vendrían a la preboda.");
    preweddingCount.focus();
    return;
  }

  const companionEntries = Array.from(companionFields.querySelectorAll(".companion-entry"));
  const companions = companionEntries.map((entry) => ({
    name: entry.querySelector("[data-companion-name]").value.trim(),
    allergies: entry.querySelector("[data-companion-none]").checked
      ? "Ninguna"
      : entry.querySelector("[data-companion-allergies]").value.trim()
  }));

  const missingCompanion = companionEntries.find((entry) => !entry.querySelector("[data-companion-name]").value.trim());
  if (attending && missingCompanion) {
    showToast("Por favor, indica el nombre y apellidos de cada acompañante.");
    missingCompanion.querySelector("[data-companion-name]").focus();
    return;
  }

  if (bus && !busPickup.value) {
    showToast("Por favor, selecciona dónde subirás al autocar para la ida.");
    busPickup.focus();
    return;
  }

  if (bus && !busDropoff.value) {
    showToast("Por favor, selecciona dónde bajarás del autocar en la vuelta.");
    busDropoff.focus();
    return;
  }

  const payload = {
    attending,
    name: respondentName,
    guests: attending ? Number(guests.value) : 0,
    allergies: attending ? (noneAllergies.checked ? "Ninguna" : allergies.value.trim()) : "",
    companions: attending ? companions : [],
    prewedding: wantsPrewedding,
    preweddingGuests: wantsPrewedding ? Number(preweddingCount.value) : 0,
    bus,
    busPickup: bus ? busPickup.value : "",
    busDropoff: bus ? busDropoff.value : "",
    songs: state.selectedSongs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      artwork: song.artwork,
      spotifyUrl: song.spotifyUrl
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

const weddingCountdown = document.getElementById("weddingCountdown");

if (weddingCountdown) {
  const madridDateFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const getMadridDateParts = (date) => Object.fromEntries(
    madridDateFormatter.formatToParts(date).map(({ type, value }) => [type, value])
  );
  const targetUtcGuess = Date.UTC(2027, 8, 18);
  const targetMadridParts = getMadridDateParts(new Date(targetUtcGuess));
  const madridOffsetAtTarget = Date.UTC(
    Number(targetMadridParts.year),
    Number(targetMadridParts.month) - 1,
    Number(targetMadridParts.day),
    Number(targetMadridParts.hour),
    Number(targetMadridParts.minute),
    Number(targetMadridParts.second)
  ) - targetUtcGuess;
  const weddingDate = new Date(targetUtcGuess - madridOffsetAtTarget);
  const countdownUnits = weddingCountdown.querySelector(".countdown-units");
  const countdownCaption = weddingCountdown.querySelector(".countdown-caption");
  const countdownMessage = weddingCountdown.querySelector(".countdown-message");
  let countdownTimer = null;

  const updateWeddingCountdown = () => {
    const now = new Date();
    const remaining = weddingDate.getTime() - now.getTime();

    if (remaining <= 0) {
      countdownUnits.hidden = true;
      countdownCaption.hidden = true;
      countdownMessage.hidden = false;
      const madridToday = getMadridDateParts(now);
      countdownMessage.textContent = madridToday.year === "2027"
        && madridToday.month === "09"
        && madridToday.day === "18"
        ? "¡Hoy es el gran día!"
        : "¡Gracias por celebrar con nosotros!";
      if (countdownTimer !== null) window.clearInterval(countdownTimer);
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    weddingCountdown.querySelector("[data-countdown-days]").textContent = String(days).padStart(3, "0");
    weddingCountdown.querySelector("[data-countdown-hours]").textContent = String(hours).padStart(2, "0");
    weddingCountdown.querySelector("[data-countdown-minutes]").textContent = String(minutes).padStart(2, "0");
    weddingCountdown.querySelector("[data-countdown-seconds]").textContent = String(seconds).padStart(2, "0");
  };

  updateWeddingCountdown();
  countdownTimer = window.setInterval(updateWeddingCountdown, 1000);
}

renderCompanionFields();
updateAttendanceDetails();
updatePreweddingDetails();
updateBusDetails();
renderSelectedSongs();
void playBackgroundAudio();
