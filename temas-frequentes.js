const topicsFile = "data/questoes/temas-frequentes.json?v=temas-robusto-2";

const state = {
  data: null,
  themes: [],
  visibleCount: 36,
  filters: {
    query: "",
    area: "all",
    subject: "all",
    frequency: "all",
    sort: "priority"
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  await loadTopics();
  renderAll();
  refreshIcons();
}

function bindEvents() {
  $("#searchInput").addEventListener("input", (event) => {
    state.filters.query = event.target.value.trim().toLowerCase();
    state.visibleCount = 36;
    renderResults();
  });

  $("#sortSelect").addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    renderResults();
  });

  $("#loadMoreButton").addEventListener("click", () => {
    state.visibleCount += 36;
    renderResults();
  });
}

async function loadTopics() {
  try {
    const response = await fetch(topicsFile);
    if (!response.ok) throw new Error("Arquivo não carregado.");
    state.data = await response.json();
    state.themes = state.data.areas.flatMap((area) =>
      area.collections.flatMap((collection) =>
        collection.themes.map((theme) => ({
          ...theme,
          areaIcon: area.icon,
          areaShortLabel: area.shortLabel
        }))
      )
    );
  } catch (error) {
    state.data = { totals: { areas: 0, collections: 0, themes: 0 }, areas: [] };
    state.themes = [];
    showToast("Não foi possível carregar temas frequentes.");
  }
}

function renderAll() {
  renderStats();
  renderFilters();
  renderOverview();
  renderResults();
}

function renderStats() {
  $("#statAreas").textContent = state.data.totals.areas;
  $("#statCollections").textContent = state.data.totals.collections;
  $("#statThemes").textContent = state.data.totals.themes;
  $("#sidebarCount").textContent = `${state.data.totals.themes} temas`;
}

function renderFilters() {
  const areas = [{ value: "all", label: "Todas" }, ...state.data.areas.map((area) => ({
    value: area.area,
    label: area.shortLabel || area.areaLabel
  }))];
  const subjects = unique(state.themes.map((theme) => theme.subject)).map((subject) => ({ value: subject, label: subject }));
  const frequencies = unique(state.themes.map((theme) => theme.frequency)).map((frequency) => ({ value: frequency, label: frequency }));

  $("#areaFilters").innerHTML = renderChips(areas, "area");
  $("#subjectFilters").innerHTML = renderChips([{ value: "all", label: "Todas" }, ...subjects], "subject");
  $("#frequencyFilters").innerHTML = renderChips([{ value: "all", label: "Todas" }, ...frequencies], "frequency");

  $$("[data-area-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.area = button.dataset.areaFilter;
      state.visibleCount = 36;
      renderFilters();
      renderOverview();
      renderResults();
    });
  });

  $$("[data-subject-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.subject = button.dataset.subjectFilter;
      state.visibleCount = 36;
      renderFilters();
      renderResults();
    });
  });

  $$("[data-frequency-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.frequency = button.dataset.frequencyFilter;
      state.visibleCount = 36;
      renderFilters();
      renderResults();
    });
  });
}

function renderChips(items, type) {
  return items.map((item) => `
    <button class="filter-chip ${state.filters[type] === item.value ? "active" : ""}" type="button" data-${type}-filter="${escapeAttr(item.value)}">
      ${item.label}
    </button>
  `).join("");
}

function renderOverview() {
  const areas = state.filters.area === "all"
    ? state.data.areas
    : state.data.areas.filter((area) => area.area === state.filters.area);

  $("#areaOverview").innerHTML = areas.map((area) => `
    <article class="area-card">
      <span class="frequent-icon"><i data-lucide="${area.icon}"></i></span>
      <h3>${area.shortLabel}</h3>
      <p>${area.totals.themes} temas, ${area.totals.collections} apostilas e ${area.totals.subjects} matérias.</p>
    </article>
  `).join("");
  refreshIcons();
}

function renderResults() {
  const results = sortThemes(filterThemes());
  $("#resultsTitle").textContent = `${results.length} temas encontrados`;

  if (!results.length) {
    $("#themesList").innerHTML = `<div class="empty-state">Nenhum tema encontrado com esses filtros.</div>`;
    $("#loadMoreButton").hidden = true;
    return;
  }

  const visible = results.slice(0, state.visibleCount);
  $("#themesList").innerHTML = visible.map(renderThemeCard).join("");
  $("#loadMoreButton").hidden = visible.length >= results.length;
  $("#loadMoreButton").textContent = `Carregar mais temas (${visible.length}/${results.length})`;
  refreshIcons();
}

function filterThemes() {
  return state.themes.filter((theme) => {
    if (state.filters.area !== "all" && theme.area !== state.filters.area) return false;
    if (state.filters.subject !== "all" && theme.subject !== state.filters.subject) return false;
    if (state.filters.frequency !== "all" && theme.frequency !== state.filters.frequency) return false;
    if (!state.filters.query) return true;
    const haystack = [
      theme.title,
      theme.subject,
      theme.bookletTitle,
      theme.chapterTitle,
      theme.frequency,
      theme.whyFrequent,
      theme.coreFormulaOrModel,
      ...theme.tags,
      ...theme.appearsAs,
      ...theme.howToSolve,
      ...theme.commonMistakes,
      ...theme.questionSignals,
      ...(theme.relatedTopics || []),
      ...(theme.resolutionModel || []).map((item) => `${item.step} ${item.detail}`)
    ].join(" ").toLowerCase();
    return haystack.includes(state.filters.query);
  });
}

function sortThemes(themes) {
  return [...themes].sort((a, b) => {
    if (state.filters.sort === "area") return a.areaLabel.localeCompare(b.areaLabel) || a.title.localeCompare(b.title);
    if (state.filters.sort === "subject") return a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title);
    if (state.filters.sort === "title") return a.title.localeCompare(b.title);
    return (b.priority || 0) - (a.priority || 0) || a.title.localeCompare(b.title);
  });
}

function renderThemeCard(theme) {
  return `
    <article class="theme-card">
      <header>
        <div>
          <span class="eyebrow">${theme.areaShortLabel} / ${theme.subject}</span>
          <h3>${theme.title}</h3>
          <div class="theme-meta">
            <span class="meta-pill">${theme.frequency}</span>
            <span class="meta-pill">${theme.bookletTitle}</span>
            <span class="meta-pill">${theme.chapterTitle}</span>
          </div>
        </div>
        <span class="frequent-icon"><i data-lucide="${theme.areaIcon || "badge-help"}"></i></span>
      </header>

      <div class="theme-grid">
        ${renderBlock("Como aparece", theme.appearsAs)}
        ${renderBlock("Como resolver", theme.howToSolve, "ol")}
        ${renderKeyModel(theme)}
        ${renderObjectBlock("Modelo de resolução", theme.resolutionModel)}
        ${renderBlock("Erros comuns", theme.commonMistakes)}
        ${renderBlock("Sinais no enunciado", theme.questionSignals)}
        ${renderBlock("Comandos típicos", theme.commandPatterns)}
        ${renderBlock("Leitura visual", theme.visualReading)}
        <section class="mini-question">
          <p>${theme.miniQuestion.prompt}</p>
          <ol type="A">
            ${theme.miniQuestion.alternatives.map(renderAlternative).join("")}
          </ol>
          <p><strong>Gabarito:</strong> ${theme.miniQuestion.answer}. ${theme.miniQuestion.explanation}</p>
        </section>
        ${renderPracticeModels(theme.practiceModels)}
        ${renderBlock("Trilha de revisão", theme.studyPath, "ol")}
      </div>

      <div class="tag-row">
        ${theme.tags.slice(0, 10).map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderKeyModel(theme) {
  return `
    <section class="theme-block model-highlight">
      <strong>Fórmula ou modelo-chave</strong>
      <p>${theme.coreFormulaOrModel}</p>
    </section>
  `;
}

function renderObjectBlock(title, items) {
  return `
    <section class="theme-block">
      <strong>${title}</strong>
      <ol>
        ${(items || []).map((item) => `<li><b>${item.step}</b><span>${item.detail}</span></li>`).join("")}
      </ol>
    </section>
  `;
}

function renderPracticeModels(items) {
  return `
    <section class="theme-block practice-models">
      <strong>Modelos de questão</strong>
      ${(items || []).map((item) => `
        <article>
          <b>${item.title}</b>
          <p>${item.situation}</p>
          <small>${item.task}</small>
          <span>${item.answerStrategy}</span>
        </article>
      `).join("")}
    </section>
  `;
}

function renderAlternative(alternative, index) {
  if (typeof alternative === "string") {
    return `<li><b>${"ABCDE"[index]})</b> ${alternative}</li>`;
  }

  return `<li><b>${alternative.letter})</b> ${alternative.text}</li>`;
}

function renderBlock(title, items, listType = "ul") {
  const tag = listType === "ol" ? "ol" : "ul";
  return `
    <section class="theme-block">
      <strong>${title}</strong>
      <${tag}>
        ${(items || []).map((item) => `<li>${item}</li>`).join("")}
      </${tag}>
    </section>
  `;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function escapeAttr(value) {
  return String(value).replace(/"/g, "&quot;");
}

function showToast(message) {
  $("#toastText").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $("#toast").classList.remove("show"), 2200);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
