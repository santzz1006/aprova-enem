const profileKey = "saasEnemStudentProfileV2";
const settingsKey = "saasEnemSettingsV1";
const progressKey = "saasEnemQuizProgressV1";
const indexFile = "data/quiz/quiz-index.json";

const areaLabels = {
  linguagens: "Linguagens",
  humanas: "Humanas",
  natureza: "Natureza",
  matematica: "Matemática"
};

const difficultyLabels = {
  essencial: "Essencial",
  intermediário: "Intermediário",
  desafio: "Desafio",
  revisão: "Revisão"
};

const areaMessages = {
  linguagens: "Seu treino abriu com foco em leitura, gêneros textuais, literatura, artes e línguas. A ideia é praticar interpretação com atenção ao comando e às pistas do texto.",
  humanas: "Seu treino abriu com foco em história, geografia, sociologia e filosofia. O objetivo é ligar conceitos, fontes, contextos sociais e consequências.",
  natureza: "Seu treino abriu com foco em biologia, química e física. A prioridade é entender fenômenos, dados, processos e relações de causa e efeito.",
  matematica: "Seu treino abriu com foco em matemática. Aqui o importante é ler dados, escolher a relação correta, montar o cálculo e conferir unidades."
};

const state = {
  profile: null,
  settings: {},
  progress: {},
  index: null,
  banks: [],
  questions: [],
  filtered: [],
  currentIndex: 0,
  selectedAlternative: null,
  recommendedOnly: true,
  filters: {
    query: "",
    area: "all",
    subject: "all",
    booklet: "all",
    difficulty: "all",
    status: "all",
    sort: "recommended"
  },
  session: {
    title: "Treino livre",
    ids: []
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  questionCard: $("#questionCard"),
  toast: $("#toast"),
  toastText: $("#toastText"),
  screenDim: $("#screenDim")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  state.profile = readJson(profileKey);
  state.settings = readJson(settingsKey) || {};
  state.progress = readJson(progressKey) || {};
  applySettings();
  bindEvents();
  await loadQuiz();
  applyInitialPersonalization();
  renderAll();
  refreshIcons();
}

function bindEvents() {
  $("#mobileMenuButton").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  elements.screenDim.addEventListener("click", () => document.body.classList.remove("menu-open"));

  $("#searchInput").addEventListener("input", (event) => {
    state.filters.query = event.target.value.trim().toLowerCase();
    state.currentIndex = 0;
    state.recommendedOnly = false;
    renderResults();
  });

  $("#bookletSelect").addEventListener("change", (event) => {
    state.filters.booklet = event.target.value;
    state.currentIndex = 0;
    state.recommendedOnly = false;
    renderFilterOptions();
    renderResults();
  });

  $("#sortSelect").addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    state.currentIndex = 0;
    renderResults();
  });

  $("#clearFiltersButton").addEventListener("click", clearFilters);
  $("#showRecommendedButton").addEventListener("click", showRecommended);
  $("#showAllButton").addEventListener("click", showAll);
  $("#quickStartButton").addEventListener("click", startQuickTraining);
  $("#reviewErrorsButton").addEventListener("click", startErrorReview);
  $("#previousQuestionButton").addEventListener("click", previousQuestion);
  $("#nextQuestionButton").addEventListener("click", nextQuestion);
  $("#favoriteButton").addEventListener("click", toggleFavorite);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.body.classList.remove("menu-open");
    }
    if (event.key === "ArrowRight") {
      nextQuestion();
    }
    if (event.key === "ArrowLeft") {
      previousQuestion();
    }
  });
}

async function loadQuiz() {
  try {
    const indexResponse = await fetch(indexFile);
    if (!indexResponse.ok) {
      throw new Error("Não foi possível carregar o índice do quiz.");
    }

    state.index = await indexResponse.json();
    const responses = await Promise.all(state.index.summary.map((item) => fetch(item.file)));
    const failed = responses.find((response) => !response.ok);

    if (failed) {
      throw new Error("Não foi possível carregar todos os bancos do quiz.");
    }

    state.banks = await Promise.all(responses.map((response) => response.json()));
    state.questions = state.banks.flatMap((bank) => bank.questions).map(normalizeQuestion);
    state.session.ids = state.questions.slice(0, 20).map((question) => question.id);
  } catch (error) {
    state.index = { summary: [], booklets: [] };
    state.banks = [];
    state.questions = [];
    $("#alertTitle").textContent = "Quiz não carregado";
    $("#alertText").textContent = "Os arquivos JSON não puderam ser lidos. Abra a página por um servidor local para carregar data/quiz/*.json.";
    showToast("Falha ao carregar o banco de questões.");
  }
}

function normalizeQuestion(question) {
  return {
    ...question,
    searchText: [
      question.areaLabel,
      question.subject,
      question.bookletTitle,
      question.chapterTitle,
      question.topic,
      question.skill,
      question.prompt,
      question.stimulus?.text,
      ...(question.tags || []),
      ...(question.alternatives || []).map((alternative) => alternative.text)
    ].join(" ").toLowerCase()
  };
}

function applyInitialPersonalization() {
  const preferredArea = state.profile?.answers?.area;

  if (preferredArea && areaLabels[preferredArea]) {
    state.filters.area = preferredArea;
    state.recommendedOnly = true;
    state.session.title = `Treino de ${areaLabels[preferredArea]}`;
    $("#personalizedMessage").textContent = `Seu diagnóstico destacou ${areaLabels[preferredArea]}. Por isso, o quiz começa por essa área, mas todas as matérias seguem disponíveis.`;
    $("#alertTitle").textContent = `Prioridade por ${areaLabels[preferredArea]}`;
    $("#alertText").textContent = areaMessages[preferredArea];
    $("#sidebarArea").textContent = areaLabels[preferredArea];
    return;
  }

  state.recommendedOnly = false;
  $("#personalizedMessage").textContent = "Nenhum diagnóstico foi encontrado. O quiz abriu completo, com todas as áreas disponíveis por busca e filtros.";
  $("#alertTitle").textContent = "Quiz completo";
  $("#alertText").textContent = "Responda o mini questionário no dashboard para o quiz abrir priorizando sua área de estudo.";
  $("#sidebarArea").textContent = "Todas as áreas";
}

function renderAll() {
  renderFilterOptions();
  renderStats();
  renderResults();
  updateSessionPanel();
}

function renderFilterOptions() {
  const areas = [{ value: "all", label: "Todas" }, ...state.index.summary.map((item) => ({
    value: item.area,
    label: areaLabels[item.area] || item.areaLabel
  }))];
  const subjectSource = state.index.booklets.filter((booklet) => state.filters.area === "all" || booklet.area === state.filters.area);
  const subjects = unique(subjectSource.map((booklet) => booklet.subject)).map((subject) => ({ value: subject, label: subject }));
  const bookletSource = subjectSource.filter((booklet) => state.filters.subject === "all" || booklet.subject === state.filters.subject);
  const difficulties = unique(state.questions.map((question) => question.difficulty)).map((difficulty) => ({
    value: difficulty,
    label: difficultyLabels[difficulty] || difficulty
  }));

  $("#areaFilters").innerHTML = renderChips(areas, "area");
  $("#subjectFilters").innerHTML = renderChips([{ value: "all", label: "Todas" }, ...subjects], "subject");
  $("#difficultyFilters").innerHTML = renderChips([{ value: "all", label: "Todas" }, ...difficulties], "difficulty");
  $("#bookletSelect").innerHTML = [
    '<option value="all">Todas as apostilas</option>',
    ...bookletSource.map((booklet) => `<option value="${escapeAttr(booklet.bookletId)}">${escapeHtml(booklet.title)}</option>`)
  ].join("");
  $("#bookletSelect").value = bookletSource.some((booklet) => booklet.bookletId === state.filters.booklet) ? state.filters.booklet : "all";

  $$("[data-area-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.area = button.dataset.areaFilter;
      state.filters.subject = "all";
      state.filters.booklet = "all";
      state.currentIndex = 0;
      state.recommendedOnly = false;
      renderFilterOptions();
      renderResults();
    });
  });

  $$("[data-subject-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.subject = button.dataset.subjectFilter;
      state.filters.booklet = "all";
      state.currentIndex = 0;
      renderFilterOptions();
      renderResults();
    });
  });

  $$("[data-difficulty-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.difficulty = button.dataset.difficultyFilter;
      state.currentIndex = 0;
      renderFilterOptions();
      renderResults();
    });
  });

  $$("[data-status-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.statusFilter === state.filters.status);
    button.addEventListener("click", () => {
      state.filters.status = button.dataset.statusFilter;
      state.currentIndex = 0;
      $$("[data-status-filter]").forEach((item) => item.classList.toggle("active", item === button));
      renderResults();
    });
  });
}

function renderChips(items, type) {
  return items.map((item) => {
    const active = state.filters[type] === item.value ? " active" : "";
    return `<button class="filter-chip${active}" type="button" data-${type}-filter="${escapeAttr(item.value)}">${escapeHtml(item.label)}</button>`;
  }).join("");
}

function renderStats() {
  const totalAnswered = Object.values(state.progress).filter((item) => item.answered).length;
  const totalCorrect = Object.values(state.progress).filter((item) => item.correct).length;
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  $("#statQuestions").textContent = formatNumber(state.questions.length);
  $("#statAnswered").textContent = formatNumber(totalAnswered);
  $("#statAccuracy").textContent = `${accuracy}%`;
  $("#sidebarAccuracy").style.width = `${accuracy}%`;
  $("#sidebarProgressText").textContent = totalAnswered
    ? `${formatNumber(totalAnswered)} questões respondidas, ${accuracy}% de acerto.`
    : "Nenhuma questão respondida ainda.";
}

function renderResults() {
  state.filtered = getFilteredQuestions();

  if (state.currentIndex >= state.filtered.length) {
    state.currentIndex = Math.max(0, state.filtered.length - 1);
  }

  state.selectedAlternative = null;
  updateContext();
  renderQuestion();
  renderQuestionMap();
  updateSessionPanel();
  renderStats();
  refreshIcons();
}

function getFilteredQuestions() {
  const preferredArea = state.profile?.answers?.area;
  let results = state.questions.filter((question) => {
    const progress = state.progress[question.id] || {};
    const matchesQuery = !state.filters.query || question.searchText.includes(state.filters.query);
    const matchesArea = state.filters.area === "all" || question.area === state.filters.area;
    const matchesSubject = state.filters.subject === "all" || question.subject === state.filters.subject;
    const matchesBooklet = state.filters.booklet === "all" || question.bookletId === state.filters.booklet;
    const matchesDifficulty = state.filters.difficulty === "all" || question.difficulty === state.filters.difficulty;
    const matchesStatus = matchesStatusFilter(progress);
    const matchesRecommended = !state.recommendedOnly || !preferredArea || question.area === preferredArea;

    return matchesQuery && matchesArea && matchesSubject && matchesBooklet && matchesDifficulty && matchesStatus && matchesRecommended;
  });

  results = [...results].sort((a, b) => {
    const aProgress = state.progress[a.id] || {};
    const bProgress = state.progress[b.id] || {};

    if (state.filters.sort === "new") {
      return Number(Boolean(aProgress.answered)) - Number(Boolean(bProgress.answered));
    }
    if (state.filters.sort === "wrong") {
      return Number(Boolean(bProgress.answered && !bProgress.correct)) - Number(Boolean(aProgress.answered && !aProgress.correct));
    }
    if (state.filters.sort === "difficulty") {
      return difficultyScore(a.difficulty) - difficultyScore(b.difficulty);
    }

    return recommendedScore(b) - recommendedScore(a);
  });

  return results;
}

function matchesStatusFilter(progress) {
  if (state.filters.status === "new") {
    return !progress.answered;
  }
  if (state.filters.status === "correct") {
    return Boolean(progress.answered && progress.correct);
  }
  if (state.filters.status === "wrong") {
    return Boolean(progress.answered && !progress.correct);
  }
  if (state.filters.status === "favorite") {
    return Boolean(progress.favorite);
  }
  return true;
}

function recommendedScore(question) {
  const progress = state.progress[question.id] || {};
  const preferredArea = state.profile?.answers?.area;
  let score = 0;

  if (preferredArea && question.area === preferredArea) score += 40;
  if (!progress.answered) score += 24;
  if (progress.answered && !progress.correct) score += 32;
  if (question.difficulty === "essencial") score += 8;
  if (question.difficulty === "intermediário") score += 5;
  if (progress.favorite) score += 4;

  return score;
}

function difficultyScore(difficulty) {
  return {
    essencial: 1,
    intermediário: 2,
    desafio: 3,
    revisão: 4
  }[difficulty] || 5;
}

function updateContext() {
  const contextParts = [];

  if (state.filters.area !== "all") contextParts.push(areaLabels[state.filters.area] || state.filters.area);
  if (state.filters.subject !== "all") contextParts.push(state.filters.subject);
  if (state.filters.difficulty !== "all") contextParts.push(difficultyLabels[state.filters.difficulty] || state.filters.difficulty);
  if (state.filters.status !== "all") contextParts.push(statusLabel(state.filters.status));

  $("#activeContext").textContent = state.filtered.length
    ? `${formatNumber(state.filtered.length)} questões encontradas${contextParts.length ? ` em ${contextParts.join(" · ")}` : ""}`
    : "Nenhuma questão encontrada";
}

function renderQuestion() {
  const question = state.filtered[state.currentIndex];

  $("#previousQuestionButton").disabled = !state.filtered.length || state.currentIndex === 0;
  $("#nextQuestionButton").disabled = !state.filtered.length || state.currentIndex >= state.filtered.length - 1;

  if (!question) {
    elements.questionCard.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search-x"></i>
        <strong>Nenhuma questão encontrada</strong>
        <span>Experimente limpar filtros, mudar a área ou ver todas as questões.</span>
      </div>
    `;
    $("#favoriteButton").classList.remove("active");
    return;
  }

  const progress = state.progress[question.id] || {};
  $("#favoriteButton").classList.toggle("active", Boolean(progress.favorite));

  elements.questionCard.innerHTML = `
    <article class="question-view" data-question-id="${escapeAttr(question.id)}">
      <div class="question-meta">
        <span class="meta-pill"><i data-lucide="${areaIcon(question.area)}"></i>${escapeHtml(areaLabels[question.area] || question.areaLabel)}</span>
        <span class="meta-pill"><i data-lucide="book-open"></i>${escapeHtml(question.subject)}</span>
        <span class="meta-pill"><i data-lucide="layers-3"></i>${escapeHtml(difficultyLabels[question.difficulty] || question.difficulty)}</span>
        <span class="meta-pill"><i data-lucide="list-checks"></i>${state.currentIndex + 1} de ${state.filtered.length}</span>
      </div>
      ${renderStimulus(question.stimulus)}
      <h3 class="question-prompt">${escapeHtml(question.prompt)}</h3>
      <div class="alternatives" id="alternatives">
        ${question.alternatives.map((alternative) => renderAlternative(question, alternative, progress)).join("")}
      </div>
      ${progress.answered ? renderFeedback(question, progress) : ""}
    </article>
  `;

  $$(".alternative-button").forEach((button) => {
    button.addEventListener("click", () => answerQuestion(question, button.dataset.alternative));
  });

  updateStudySuggestion(question);
  refreshIcons();
}

function renderStimulus(stimulus = {}) {
  const chart = stimulus.chart ? renderChart(stimulus.chart) : "";
  const table = stimulus.table ? renderTable(stimulus.table) : "";

  return `
    <section class="stimulus-card">
      <h3>${escapeHtml(stimulus.title || "Texto de apoio")}</h3>
      <p>${escapeHtml(stimulus.text || "Leia a situação com atenção antes de escolher a alternativa.")}</p>
      ${chart}
      ${table}
    </section>
  `;
}

function renderChart(chart) {
  const max = Math.max(...chart.data.map((item) => Number(item.value) || 0), 1);

  return `
    <div class="chart-box" role="img" aria-label="${escapeAttr(chart.title || "Gráfico de apoio")}">
      <strong>${escapeHtml(chart.title || "Gráfico de apoio")}</strong>
      ${chart.data.map((item) => {
        const width = Math.max(6, Math.round(((Number(item.value) || 0) / max) * 100));
        return `
          <div class="chart-row">
            <span>${escapeHtml(item.label)}</span>
            <span class="chart-track"><span class="chart-fill" style="--bar-width: ${width}%"></span></span>
            <span>${escapeHtml(String(item.value))}</span>
          </div>
        `;
      }).join("")}
      ${chart.note ? `<p>${escapeHtml(chart.note)}</p>` : ""}
    </div>
  `;
}

function renderTable(table) {
  return `
    <table class="data-table">
      <caption class="sr-only">${escapeHtml(table.title || "Tabela de apoio")}</caption>
      <thead>
        <tr>${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

function renderAlternative(question, alternative, progress) {
  const answered = Boolean(progress.answered);
  const isChosen = progress.chosen === alternative.id;
  const isCorrect = question.answer === alternative.id;
  const classNames = ["alternative-button"];

  if (isChosen) classNames.push("selected");
  if (answered && isCorrect) classNames.push("correct");
  if (answered && isChosen && !isCorrect) classNames.push("wrong");

  return `
    <button class="${classNames.join(" ")}" type="button" data-alternative="${escapeAttr(alternative.id)}" ${answered ? "disabled" : ""}>
      <span class="alternative-letter">${escapeHtml(alternative.id)}</span>
      <span>${escapeHtml(alternative.text)}</span>
    </button>
  `;
}

function renderFeedback(question, progress) {
  const correct = Boolean(progress.correct);
  const chosen = question.alternatives.find((alternative) => alternative.id === progress.chosen);
  const right = question.alternatives.find((alternative) => alternative.id === question.answer);

  return `
    <section class="feedback-card ${correct ? "correct" : "wrong"}">
      <h3>${correct ? "Resposta certa" : "Revisão necessária"}</h3>
      <p>${correct ? "Boa. Você escolheu a alternativa que responde ao comando da questão." : `Você marcou ${escapeHtml(chosen?.id || "-")}, mas a correta é ${escapeHtml(right?.id || question.answer)}.`}</p>
      <p>${escapeHtml(question.explanation)}</p>
      <p>${escapeHtml(question.review?.howToAvoidMistake || "Volte ao enunciado, destaque o comando e confira se a alternativa conversa com os dados apresentados.")}</p>
      <div class="feedback-actions">
        <a class="secondary-button" href="${escapeAttr(question.review?.relatedStudyUrl || "biblioteca.html")}">
          <i data-lucide="graduation-cap"></i>
          Estudar conteúdo
        </a>
        <button class="ghost-button" type="button" onclick="window.quizResetCurrentAnswer && window.quizResetCurrentAnswer()">
          <i data-lucide="refresh-cw"></i>
          Refazer depois
        </button>
      </div>
    </section>
  `;
}

function answerQuestion(question, alternativeId) {
  const correct = question.answer === alternativeId;

  state.progress[question.id] = {
    ...(state.progress[question.id] || {}),
    answered: true,
    chosen: alternativeId,
    correct,
    attempts: ((state.progress[question.id] || {}).attempts || 0) + 1,
    updatedAt: new Date().toISOString()
  };

  saveJson(progressKey, state.progress);
  ensureInSession(question.id);
  showToast(correct ? "Resposta correta. Ótimo, vamos seguir." : "Resposta salva para revisão.");
  renderQuestion();
  renderQuestionMap();
  updateSessionPanel();
  renderStats();
}

window.quizResetCurrentAnswer = function quizResetCurrentAnswer() {
  const question = state.filtered[state.currentIndex];
  if (!question) return;

  state.progress[question.id] = {
    ...(state.progress[question.id] || {}),
    answered: false,
    chosen: null,
    correct: false,
    updatedAt: new Date().toISOString()
  };

  saveJson(progressKey, state.progress);
  showToast("Questão enviada para refazer depois.");
  renderResults();
};

function ensureInSession(questionId) {
  if (!state.session.ids.includes(questionId)) {
    state.session.ids.push(questionId);
  }
}

function renderQuestionMap() {
  const slice = state.filtered.slice(Math.max(0, state.currentIndex - 12), state.currentIndex + 13);
  $("#questionMap").innerHTML = slice.map((question) => {
    const originalIndex = state.filtered.findIndex((item) => item.id === question.id);
    const progress = state.progress[question.id] || {};
    const classes = ["map-dot"];
    if (originalIndex === state.currentIndex) classes.push("active");
    if (progress.answered && progress.correct) classes.push("correct");
    if (progress.answered && !progress.correct) classes.push("wrong");
    return `<button class="${classes.join(" ")}" type="button" data-map-index="${originalIndex}">${originalIndex + 1}</button>`;
  }).join("");

  $$("[data-map-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentIndex = Number(button.dataset.mapIndex);
      renderQuestion();
      renderQuestionMap();
    });
  });
}

function updateSessionPanel() {
  const sessionIds = state.session.ids.length ? state.session.ids : state.filtered.slice(0, 20).map((question) => question.id);
  const entries = sessionIds.map((id) => state.progress[id]).filter(Boolean);
  const answered = entries.filter((entry) => entry.answered).length;
  const correct = entries.filter((entry) => entry.answered && entry.correct).length;
  const wrong = entries.filter((entry) => entry.answered && !entry.correct).length;
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;

  $("#sessionTitle").textContent = state.session.title;
  $("#sessionAnswered").textContent = answered;
  $("#sessionCorrect").textContent = correct;
  $("#sessionWrong").textContent = wrong;
  $("#sessionAccuracy").textContent = `${accuracy}%`;
  $("#sessionRing").style.setProperty("--ring", `${accuracy}%`);
}

function updateStudySuggestion(question) {
  if (!question) return;

  const progress = state.progress[question.id] || {};
  const url = question.review?.relatedStudyUrl || `ambiente-estudo.html?id=${question.bookletId}`;
  $("#studyLink").href = url;

  if (progress.answered && !progress.correct) {
    $("#studySuggestion").textContent = `Revise ${question.topic} na apostila ${question.bookletTitle}. Esse erro já ficou separado para revisão.`;
    return;
  }

  $("#studySuggestion").textContent = `Depois do quiz, estude ${question.topic} para reforçar a base dessa questão.`;
}

function previousQuestion() {
  if (state.currentIndex <= 0) return;
  state.currentIndex -= 1;
  renderQuestion();
  renderQuestionMap();
}

function nextQuestion() {
  if (state.currentIndex >= state.filtered.length - 1) return;
  state.currentIndex += 1;
  renderQuestion();
  renderQuestionMap();
}

function toggleFavorite() {
  const question = state.filtered[state.currentIndex];
  if (!question) return;

  const current = state.progress[question.id] || {};
  state.progress[question.id] = {
    ...current,
    favorite: !current.favorite,
    updatedAt: new Date().toISOString()
  };

  saveJson(progressKey, state.progress);
  showToast(state.progress[question.id].favorite ? "Questão favoritada." : "Questão removida dos favoritos.");
  renderResults();
}

function clearFilters() {
  state.filters = {
    query: "",
    area: "all",
    subject: "all",
    booklet: "all",
    difficulty: "all",
    status: "all",
    sort: "recommended"
  };
  state.currentIndex = 0;
  state.recommendedOnly = false;
  $("#searchInput").value = "";
  $("#sortSelect").value = "recommended";
  state.session.title = "Treino livre";
  renderFilterOptions();
  renderResults();
  showToast("Filtros limpos.");
}

function showRecommended() {
  const preferredArea = state.profile?.answers?.area;

  if (!preferredArea || !areaLabels[preferredArea]) {
    showToast("Responda o questionário no dashboard para ativar recomendação por área.");
    showAll();
    return;
  }

  state.filters.area = preferredArea;
  state.filters.subject = "all";
  state.filters.booklet = "all";
  state.filters.status = "all";
  state.currentIndex = 0;
  state.recommendedOnly = true;
  state.session.title = `Treino de ${areaLabels[preferredArea]}`;
  renderFilterOptions();
  renderResults();
  showToast(`Mostrando questões recomendadas de ${areaLabels[preferredArea]}.`);
}

function showAll() {
  state.recommendedOnly = false;
  state.filters.area = "all";
  state.filters.subject = "all";
  state.filters.booklet = "all";
  state.filters.status = "all";
  state.currentIndex = 0;
  state.session.title = "Treino livre";
  renderFilterOptions();
  renderResults();
  showToast("Mostrando o banco completo de questões.");
}

function startQuickTraining() {
  const preferredArea = state.profile?.answers?.area;
  state.recommendedOnly = false;
  state.filters.area = preferredArea && areaLabels[preferredArea] ? preferredArea : "all";
  state.filters.status = "new";
  state.filters.sort = "recommended";
  state.filters.subject = "all";
  state.filters.booklet = "all";
  state.currentIndex = 0;
  state.session.title = "Treino rápido";
  $("#sortSelect").value = "recommended";
  renderFilterOptions();
  renderResults();
  state.session.ids = state.filtered.slice(0, 15).map((question) => question.id);
  updateSessionPanel();
  showToast("Treino rápido montado com questões novas.");
}

function startErrorReview() {
  state.recommendedOnly = false;
  state.filters.status = "wrong";
  state.filters.sort = "wrong";
  state.currentIndex = 0;
  state.session.title = "Revisão de erros";
  $("#sortSelect").value = "wrong";
  renderFilterOptions();
  renderResults();
  state.session.ids = state.filtered.slice(0, 20).map((question) => question.id);
  updateSessionPanel();
  showToast(state.filtered.length ? "Revisão de erros aberta." : "Você ainda não tem erros salvos.");
}

function statusLabel(status) {
  return {
    new: "novas",
    correct: "acertadas",
    wrong: "erros",
    favorite: "favoritas"
  }[status] || status;
}

function areaIcon(area) {
  return {
    linguagens: "languages",
    humanas: "landmark",
    natureza: "atom",
    matematica: "calculator"
  }[area] || "circle-help";
}

function applySettings() {
  const motion = state.settings.motion || "full";
  if (state.settings.theme === "dark") {
    state.settings.theme = "light";
    saveJson(settingsKey, state.settings);
  }

  document.body.dataset.theme = "light";
  document.body.dataset.motion = motion;
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function showToast(message) {
  elements.toastText.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => elements.toast.classList.remove("show"), 2800);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value = "") {
  return escapeHtml(value);
}
