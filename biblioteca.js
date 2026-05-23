const profileKey = "saasEnemStudentProfileV2";
const settingsKey = "saasEnemSettingsV1";
const progressKey = "saasEnemLibraryProgressV1";

const dataFiles = [
  "data/biblioteca-linguagens.json",
  "data/biblioteca-humanas.json",
  "data/biblioteca-natureza.json",
  "data/biblioteca-matematica.json"
];

const areaLabels = {
  linguagens: "Linguagens",
  humanas: "Humanas",
  natureza: "Natureza",
  matematica: "Matemática"
};

const difficultyLabels = {
  essencial: "Essencial",
  intermediário: "Intermediário",
  revisão: "Revisão"
};

const state = {
  profile: null,
  settings: {},
  areas: [],
  booklets: [],
  selectedBooklet: null,
  progress: {},
  filters: {
    query: "",
    area: "all",
    subject: "all",
    difficulty: "all",
    status: "all",
    sort: "recommended"
  },
  listView: false,
  recommendedOnly: true
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  bookletGrid: $("#bookletGrid"),
  emptyState: $("#emptyState"),
  screenDim: $("#screenDim"),
  drawer: $("#bookletDrawer"),
  toast: $("#toast"),
  toastText: $("#toastText")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  state.profile = readJson(profileKey);
  state.settings = readJson(settingsKey) || {};
  state.progress = readJson(progressKey) || {};
  applySettings();
  bindEvents();
  await loadLibrary();
  applyInitialPersonalization();
  renderAll();
  refreshIcons();
}

function bindEvents() {
  $("#mobileMenuButton").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  $("#searchInput").addEventListener("input", (event) => {
    state.filters.query = event.target.value.trim().toLowerCase();
    renderResults();
  });

  $("#sortSelect").addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    renderResults();
  });

  $("#clearFiltersButton").addEventListener("click", clearFilters);
  $("#showRecommendedButton").addEventListener("click", showRecommended);
  $("#showAllButton").addEventListener("click", showAll);
  $("#toggleViewButton").addEventListener("click", toggleView);
  $("#closeDrawerButton").addEventListener("click", closeDrawer);
  $("#startReadingButton").addEventListener("click", () => setBookletProgress("reading"));
  $("#completeBookletButton").addEventListener("click", () => setBookletProgress("done"));
  $("#favoriteBookletButton").addEventListener("click", toggleSelectedFavorite);

  elements.screenDim.addEventListener("click", () => {
    closeDrawer();
    document.body.classList.remove("menu-open");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawer();
      document.body.classList.remove("menu-open");
    }
  });
}

async function loadLibrary() {
  try {
    const responses = await Promise.all(dataFiles.map((file) => fetch(file)));
    const failed = responses.find((response) => !response.ok);

    if (failed) {
      throw new Error("Não foi possível carregar todos os JSONs da biblioteca.");
    }

    state.areas = await Promise.all(responses.map((response) => response.json()));
    state.booklets = state.areas.flatMap((area) => area.collections.map((booklet) => normalizeBooklet(area, booklet)));
  } catch (error) {
    state.areas = [];
    state.booklets = [];
    $("#alertTitle").textContent = "Biblioteca não carregada";
    $("#alertText").textContent = "Os arquivos JSON não puderam ser lidos. Abra a página por um servidor local para carregar data/biblioteca-*.json.";
    showToast("Falha ao carregar os JSONs da biblioteca.");
  }
}

function normalizeBooklet(area, booklet) {
  const topics = booklet.chapters.flatMap((chapter) => chapter.topics);
  return {
    ...booklet,
    area: area.area,
    areaLabel: area.areaLabel,
    areaIcon: area.icon,
    areaMessage: area.priorityMessage,
    topicCount: topics.length,
    searchableText: [
      area.areaLabel,
      booklet.subject,
      booklet.title,
      booklet.summary,
      booklet.whyEnem,
      booklet.difficulty,
      ...booklet.tags,
      ...booklet.skills,
      ...booklet.chapters.flatMap((chapter) => [chapter.title, chapter.explanation, ...chapter.topics])
    ].join(" ").toLowerCase()
  };
}

function applyInitialPersonalization() {
  const preferredArea = state.profile?.answers?.area;

  if (preferredArea && areaLabels[preferredArea]) {
    state.filters.area = preferredArea;
    state.recommendedOnly = true;
    $("#personalizedMessage").textContent = `Seu diagnóstico destacou ${areaLabels[preferredArea]}. Por isso, os primeiros resultados priorizam apostilas dessa área, mas a biblioteca completa segue disponível.`;
    $("#alertTitle").textContent = `Priorização por ${areaLabels[preferredArea]}`;
    $("#alertText").textContent = getAreaMessage(preferredArea);
    $("#sidebarArea").textContent = areaLabels[preferredArea];
    return;
  }

  state.recommendedOnly = false;
  $("#personalizedMessage").textContent = "Nenhum diagnóstico foi encontrado. A biblioteca abriu completa, com todos os conteúdos disponíveis por busca e filtros.";
  $("#alertTitle").textContent = "Biblioteca completa";
  $("#alertText").textContent = "Responda o mini questionário no dashboard para a primeira visão abrir priorizando sua área de estudo.";
  $("#sidebarArea").textContent = "Todas as áreas";
}

function renderAll() {
  renderFilterOptions();
  renderStats();
  renderResults();
  updateSidebarProgress();
}

function renderFilterOptions() {
  const areas = [{ value: "all", label: "Todas" }, ...state.areas.map((area) => ({ value: area.area, label: areaLabels[area.area] || area.areaLabel }))];
  const subjects = unique(state.booklets.map((booklet) => booklet.subject)).map((subject) => ({ value: subject, label: subject }));
  const difficulties = unique(state.booklets.map((booklet) => booklet.difficulty)).map((difficulty) => ({
    value: difficulty,
    label: difficultyLabels[difficulty] || difficulty
  }));

  $("#areaFilters").innerHTML = renderChips(areas, "area");
  $("#subjectFilters").innerHTML = renderChips([{ value: "all", label: "Todas" }, ...subjects], "subject");
  $("#difficultyFilters").innerHTML = renderChips([{ value: "all", label: "Todas" }, ...difficulties], "difficulty");

  $$("[data-area-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.area = button.dataset.areaFilter;
      state.recommendedOnly = false;
      renderFilterOptions();
      renderResults();
    });
  });

  $$("[data-subject-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.subject = button.dataset.subjectFilter;
      renderFilterOptions();
      renderResults();
    });
  });

  $$("[data-difficulty-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.difficulty = button.dataset.difficultyFilter;
      renderFilterOptions();
      renderResults();
    });
  });

  $$("[data-status-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.statusFilter === state.filters.status);
    button.addEventListener("click", () => {
      state.filters.status = button.dataset.statusFilter;
      $$("[data-status-filter]").forEach((item) => item.classList.toggle("active", item === button));
      renderResults();
    });
  });
}

function renderChips(items, key) {
  return items.map((item) => {
    const active = state.filters[key] === item.value;
    return `<button class="filter-chip ${active ? "active" : ""}" type="button" data-${key}-filter="${item.value}">${item.label}</button>`;
  }).join("");
}

function renderStats() {
  const totalTopics = state.booklets.reduce((sum, booklet) => sum + booklet.topicCount, 0);
  const completed = state.booklets.filter((booklet) => getProgress(booklet.id).status === "done").length;

  $("#statBooklets").textContent = state.booklets.length;
  $("#statTopics").textContent = totalTopics;
  $("#statCompleted").textContent = completed;
}

function renderResults() {
  const results = getFilteredBooklets();
  const context = [];

  if (state.filters.area !== "all") {
    context.push(`Área: ${areaLabels[state.filters.area] || state.filters.area}`);
  }

  if (state.filters.subject !== "all") {
    context.push(`Matéria: ${state.filters.subject}`);
  }

  if (state.filters.difficulty !== "all") {
    context.push(`Dificuldade: ${difficultyLabels[state.filters.difficulty] || state.filters.difficulty}`);
  }

  if (state.filters.query) {
    context.push(`Busca: ${state.filters.query}`);
  }

  $("#activeContext").innerHTML = context.map((item) => `<span class="context-chip">${item}</span>`).join("");
  elements.bookletGrid.classList.toggle("list-view", state.listView);
  elements.emptyState.hidden = results.length > 0;
  elements.bookletGrid.innerHTML = results.map(renderBookletCard).join("");

  $$(".open-booklet").forEach((button) => {
    button.addEventListener("click", () => openDrawer(button.dataset.bookletId));
  });

  $$("[data-card-favorite]").forEach((button) => {
    button.addEventListener("click", () => toggleFavorite(button.dataset.cardFavorite));
  });

  $$("[data-card-complete]").forEach((button) => {
    button.addEventListener("click", () => {
      updateProgress(button.dataset.cardComplete, { status: "done", percent: 100 });
      renderAll();
      showToast("Apostila marcada como concluída.");
    });
  });

  renderStats();
  updateSidebarProgress();
  refreshIcons();
}

function renderBookletCard(booklet) {
  const progress = getProgress(booklet.id);
  const percent = progress.percent || 0;
  const statusLabel = getStatusLabel(progress.status);
  const favorite = Boolean(progress.favorite);

  return `
    <article class="booklet-card" data-area="${booklet.area}">
      <div class="booklet-top">
        <span class="booklet-icon"><i data-lucide="${booklet.areaIcon}"></i></span>
        <div class="booklet-actions">
          <button class="mini-button ${favorite ? "active" : ""}" type="button" data-card-favorite="${booklet.id}" aria-label="Favoritar ${escapeHtml(booklet.title)}">
            <i data-lucide="star"></i>
          </button>
          <button class="mini-button" type="button" data-card-complete="${booklet.id}" aria-label="Concluir ${escapeHtml(booklet.title)}">
            <i data-lucide="check"></i>
          </button>
        </div>
      </div>
      <div>
        <span class="eyebrow">${booklet.subject}</span>
        <h3>${booklet.title}</h3>
      </div>
      <p>${booklet.summary}</p>
      <div class="booklet-meta">
        <span class="meta-pill"><i data-lucide="layers"></i>${areaLabels[booklet.area] || booklet.areaLabel}</span>
        <span class="meta-pill"><i data-lucide="clock-3"></i>${booklet.estimatedMinutes} min</span>
        <span class="meta-pill"><i data-lucide="list-checks"></i>${booklet.topicCount} tópicos</span>
        <span class="meta-pill"><i data-lucide="signal"></i>${difficultyLabels[booklet.difficulty] || booklet.difficulty}</span>
      </div>
      <div class="booklet-tags">
        ${booklet.tags.slice(0, 5).map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
      <div class="booklet-progress">
        <div class="progress-meta">
          <span>${statusLabel}</span>
          <strong>${percent}%</strong>
        </div>
        <div class="progress-track" aria-hidden="true">
          <span style="width: ${percent}%"></span>
        </div>
      </div>
      <button class="primary-button open-booklet" type="button" data-booklet-id="${booklet.id}">
        <i data-lucide="book-open"></i>
        Abrir apostila
      </button>
    </article>
  `;
}

function getFilteredBooklets() {
  let results = [...state.booklets];

  if (state.filters.area !== "all") {
    results = results.filter((booklet) => booklet.area === state.filters.area);
  }

  if (state.filters.subject !== "all") {
    results = results.filter((booklet) => booklet.subject === state.filters.subject);
  }

  if (state.filters.difficulty !== "all") {
    results = results.filter((booklet) => booklet.difficulty === state.filters.difficulty);
  }

  if (state.filters.query) {
    results = results.filter((booklet) => booklet.searchableText.includes(state.filters.query));
  }

  if (state.filters.status !== "all") {
    results = results.filter((booklet) => {
      const progress = getProgress(booklet.id);

      if (state.filters.status === "favorite") {
        return Boolean(progress.favorite);
      }

      return getNormalizedStatus(progress.status) === state.filters.status;
    });
  }

  return sortBooklets(results);
}

function sortBooklets(booklets) {
  const preferredArea = state.profile?.answers?.area;

  return [...booklets].sort((a, b) => {
    if (state.filters.sort === "title") {
      return a.title.localeCompare(b.title, "pt-BR");
    }

    if (state.filters.sort === "time") {
      return a.estimatedMinutes - b.estimatedMinutes;
    }

    if (state.filters.sort === "progress") {
      return (getProgress(b.id).percent || 0) - (getProgress(a.id).percent || 0);
    }

    if (state.filters.sort === "priority") {
      return b.priority - a.priority || a.title.localeCompare(b.title, "pt-BR");
    }

    const areaScoreA = preferredArea && a.area === preferredArea ? 100 : 0;
    const areaScoreB = preferredArea && b.area === preferredArea ? 100 : 0;
    return (areaScoreB + b.priority) - (areaScoreA + a.priority) || a.title.localeCompare(b.title, "pt-BR");
  });
}

function openDrawer(bookletId) {
  const booklet = state.booklets.find((item) => item.id === bookletId);

  if (!booklet) {
    return;
  }

  state.selectedBooklet = booklet;
  const progress = getProgress(booklet.id);

  $("#drawerSubject").textContent = `${areaLabels[booklet.area] || booklet.areaLabel} / ${booklet.subject}`;
  $("#drawerTitle").textContent = booklet.title;
  $("#drawerSummary").textContent = booklet.summary;
  $("#drawerWhy").textContent = booklet.whyEnem;
  $("#studyContentButton").href = `ambiente-estudo.html?id=${encodeURIComponent(booklet.id)}`;
  $("#drawerMeta").innerHTML = `
    <span class="meta-pill"><i data-lucide="${booklet.areaIcon}"></i>${booklet.areaLabel}</span>
    <span class="meta-pill"><i data-lucide="clock-3"></i>${booklet.estimatedMinutes} min</span>
    <span class="meta-pill"><i data-lucide="list-checks"></i>${booklet.topicCount} tópicos</span>
    <span class="meta-pill"><i data-lucide="signal"></i>${difficultyLabels[booklet.difficulty] || booklet.difficulty}</span>
    <span class="meta-pill"><i data-lucide="activity"></i>${getStatusLabel(progress.status)}</span>
  `;
  $("#drawerSkills").innerHTML = booklet.skills.map((skill) => `<li>${skill}</li>`).join("");
  $("#drawerChecklist").innerHTML = booklet.checklist.map((item) => `<li>${item}</li>`).join("");
  $("#drawerChapters").innerHTML = booklet.chapters.map((chapter) => `
    <article class="chapter-card">
      <h4>${chapter.title}</h4>
      <p>${chapter.explanation}</p>
      <div class="topic-cloud">
        ${chapter.topics.map((topic) => `<span class="topic-chip">${topic}</span>`).join("")}
      </div>
    </article>
  `).join("");
  $("#favoriteBookletButton").innerHTML = progress.favorite
    ? '<i data-lucide="star"></i> Remover favorito'
    : '<i data-lucide="star"></i> Favoritar';

  elements.drawer.classList.add("show");
  elements.screenDim.classList.add("show");
  document.body.classList.add("modal-open");
  refreshIcons();
}

function closeDrawer() {
  elements.drawer.classList.remove("show");
  elements.screenDim.classList.remove("show");
  document.body.classList.remove("modal-open");
}

function setBookletProgress(status) {
  if (!state.selectedBooklet) {
    return;
  }

  const percent = status === "done" ? 100 : Math.max(getProgress(state.selectedBooklet.id).percent || 0, 35);
  updateProgress(state.selectedBooklet.id, { status, percent });
  openDrawer(state.selectedBooklet.id);
  renderResults();
  showToast(status === "done" ? "Apostila concluída." : "Apostila marcada como em estudo.");
}

function toggleSelectedFavorite() {
  if (!state.selectedBooklet) {
    return;
  }

  toggleFavorite(state.selectedBooklet.id);
  openDrawer(state.selectedBooklet.id);
}

function toggleFavorite(bookletId) {
  const current = getProgress(bookletId);
  updateProgress(bookletId, { favorite: !current.favorite });
  renderResults();
  showToast(current.favorite ? "Favorito removido." : "Apostila favoritada.");
}

function updateProgress(bookletId, changes) {
  const current = getProgress(bookletId);
  state.progress[bookletId] = {
    ...current,
    ...changes,
    updatedAt: new Date().toISOString()
  };
  saveJson(progressKey, state.progress);
}

function getProgress(bookletId) {
  return state.progress[bookletId] || {
    status: "not-started",
    percent: 0,
    favorite: false
  };
}

function getNormalizedStatus(status) {
  return status || "not-started";
}

function getStatusLabel(status) {
  const labels = {
    "not-started": "Não iniciada",
    reading: "Em estudo",
    done: "Concluída"
  };

  return labels[getNormalizedStatus(status)] || "Não iniciada";
}

function clearFilters() {
  state.filters = {
    query: "",
    area: "all",
    subject: "all",
    difficulty: "all",
    status: "all",
    sort: "recommended"
  };
  state.recommendedOnly = false;
  $("#searchInput").value = "";
  $("#sortSelect").value = "recommended";
  renderFilterOptions();
  renderResults();
  showToast("Filtros limpos.");
}

function showRecommended() {
  const preferredArea = state.profile?.answers?.area;

  if (!preferredArea || !areaLabels[preferredArea]) {
    showToast("Nenhuma área de diagnóstico encontrada.");
    return;
  }

  state.filters.area = preferredArea;
  state.filters.sort = "recommended";
  state.recommendedOnly = true;
  $("#sortSelect").value = "recommended";
  renderFilterOptions();
  renderResults();
}

function showAll() {
  state.filters.area = "all";
  state.recommendedOnly = false;
  renderFilterOptions();
  renderResults();
}

function toggleView() {
  state.listView = !state.listView;
  $("#toggleViewButton").innerHTML = state.listView
    ? '<i data-lucide="layout-grid"></i>'
    : '<i data-lucide="rows-3"></i>';
  renderResults();
}

function updateSidebarProgress() {
  const total = state.booklets.length;
  const completed = state.booklets.filter((booklet) => getProgress(booklet.id).status === "done").length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  $("#sidebarProgress").style.width = `${percent}%`;
  $("#sidebarProgressText").textContent = `${completed} de ${total} apostilas concluídas.`;
}

function getAreaMessage(area) {
  const item = state.areas.find((entry) => entry.area === area);
  return item ? item.priorityMessage : "A biblioteca está priorizando a área escolhida no diagnóstico do dashboard.";
}

function applySettings() {
  document.body.dataset.theme = state.settings.theme || "light";
  document.body.dataset.motion = state.settings.motion ? "reduced" : "full";
}

function showToast(message) {
  elements.toastText.textContent = message;
  elements.toast.classList.add("show");
  refreshIcons();
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2400);
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    return null;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function unique(items) {
  return [...new Set(items)].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
