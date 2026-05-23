const progressKey = "saasEnemExamModulesProgressV1";
const indexFile = "data/questoes/questoes-index.json";

const areaLabels = {
  humanas: "Humanas",
  linguagens: "Linguagens",
  natureza: "Natureza",
  matematica: "Matemática"
};

const state = {
  index: null,
  module: null,
  modules: [],
  currentModuleId: null,
  currentIndex: 0,
  progress: {},
  reviewWrongOnly: false
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  state.progress = readJson(progressKey) || {};
  bindEvents();
  await loadIndex();
  await loadModule(state.modules[0]?.id);
  renderAll();
  refreshIcons();
}

function bindEvents() {
  $("#mobileMenuButton").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  $("#screenDim").addEventListener("click", () => document.body.classList.remove("menu-open"));
  $("#previousButton").addEventListener("click", previousQuestion);
  $("#nextButton").addEventListener("click", nextQuestion);
  $("#continueButton").addEventListener("click", continueModule);
  $("#showAnswerButton").addEventListener("click", revealAnswer);
  $("#favoriteButton").addEventListener("click", toggleFavorite);
  $("#reviewWrongButton").addEventListener("click", toggleWrongReview);

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") nextQuestion();
    if (event.key === "ArrowLeft") previousQuestion();
    if (event.key === "Escape") document.body.classList.remove("menu-open");
  });
}

async function loadIndex() {
  try {
    const response = await fetch(indexFile);
    if (!response.ok) throw new Error("Índice não carregado.");
    state.index = await response.json();
    state.modules = state.index.modules || [];
    $("#statModules").textContent = state.index.totals?.modules || state.modules.length;
    $("#statQuestions").textContent = state.index.totals?.questions || 0;
  } catch (error) {
    state.index = { modules: [], totals: { modules: 0, questions: 0 } };
    state.modules = [];
    showToast("Não foi possível carregar data/questoes.");
  }
}

async function loadModule(moduleId) {
  const moduleInfo = state.modules.find((module) => module.id === moduleId) || state.modules[0];
  if (!moduleInfo) return;

  try {
    const response = await fetch(moduleInfo.file);
    if (!response.ok) throw new Error("Módulo não carregado.");
    state.module = await response.json();
    state.currentModuleId = state.module.id;
    state.currentIndex = getModuleProgress().lastIndex || 0;
    state.reviewWrongOnly = false;
  } catch (error) {
    showToast("Falha ao carregar módulo de questões.");
  }
}

function renderAll() {
  renderModules();
  renderModuleInfo();
  renderAreaTabs();
  renderQuestionMap();
  renderQuestion();
  renderStats();
  renderAreaPerformance();
  refreshIcons();
}

function renderModules() {
  $("#moduleStrip").innerHTML = state.modules.map((module) => {
    const progress = getProgressForModule(module.id);
    const answered = Object.values(progress.answers || {}).length;
    const percent = module.totalQuestions ? Math.round((answered / module.totalQuestions) * 100) : 0;

    return `
      <button class="module-card ${module.id === state.currentModuleId ? "active" : ""}" type="button" data-module-id="${module.id}">
        <span class="eyebrow">${module.totalQuestions} questões</span>
        <strong>${module.title}</strong>
        <small>${module.description}</small>
        <div class="module-progress" aria-hidden="true"><span style="width: ${percent}%"></span></div>
      </button>
    `;
  }).join("");

  $$("[data-module-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await loadModule(button.dataset.moduleId);
      renderAll();
      showToast(`${state.module.title} carregado.`);
    });
  });
}

function renderModuleInfo() {
  if (!state.module) return;
  $("#moduleTitle").textContent = state.module.title;
  $("#moduleDescription").textContent = state.module.description;
  $("#sidebarModule").textContent = state.module.title;
  $("#moduleMeta").innerHTML = state.module.structure.map((item) => `
    <span class="meta-pill">${item.areaLabel}: ${item.start}-${item.end}</span>
  `).join("");
}

function renderAreaTabs() {
  if (!state.module) return;
  const current = currentQuestion();
  $("#areaTabs").innerHTML = state.module.structure.map((block) => {
    const answered = getQuestionsByArea(block.area).filter((question) => getAnswer(question.id)).length;
    return `
      <button class="area-tab ${current?.area === block.area ? "active" : ""}" type="button" data-area="${block.area}">
        <span>${areaLabels[block.area] || block.areaLabel}</span>
        <small>${answered}/${block.count}</small>
      </button>
    `;
  }).join("");

  $$("[data-area]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = state.module.questions.findIndex((question) => question.area === button.dataset.area);
      if (index >= 0) {
        state.currentIndex = index;
        saveLastIndex();
        renderAll();
      }
    });
  });
}

function renderQuestionMap() {
  if (!state.module) return;
  $("#questionMap").innerHTML = visibleQuestions().map((question, visibleIndex) => {
    const realIndex = state.module.questions.findIndex((item) => item.id === question.id);
    const answer = getAnswer(question.id);
    const status = answer ? answer.status : "";
    return `
      <button class="map-dot ${realIndex === state.currentIndex ? "active" : ""} ${status}" type="button" data-question-index="${realIndex}">
        ${question.order}
      </button>
    `;
  }).join("");

  $$("[data-question-index]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentIndex = Number(button.dataset.questionIndex);
      saveLastIndex();
      renderAll();
    });
  });
}

function renderQuestion() {
  const question = currentQuestion();
  if (!question) {
    $("#questionCard").innerHTML = `
      <div class="loading-state">
        <strong>Nenhuma questão encontrada.</strong>
        <span>Carregue um módulo ou desative a revisão de erros.</span>
      </div>
    `;
    return;
  }

  const saved = getAnswer(question.id);
  const favorite = Boolean(getModuleProgress().favorites?.[question.id]);
  $("#favoriteButton").classList.toggle("active", favorite);
  $("#questionContext").textContent = `${question.areaLabel} / ${question.subject} / ${question.topic}`;
  $("#questionTitle").textContent = `Questão ${question.order}`;

  $("#questionCard").innerHTML = `
    <div class="question-head">
      <span class="question-chip">${question.areaLabel}</span>
      <span class="question-chip">${question.subject}</span>
      <span class="question-chip">${question.difficulty}</span>
      <span class="question-chip">${question.reference.note}</span>
    </div>
    ${renderStimulus(question.stimulus)}
    <p class="question-prompt">${question.prompt}</p>
    <div class="alternatives">
      ${question.alternatives.map((alternative) => renderAlternative(question, alternative, saved)).join("")}
    </div>
    <div class="feedback-box ${saved ? "show" : ""}" id="feedbackBox">
      <strong>${saved?.correct ? "Você acertou." : saved ? "Você errou." : "Gabarito"}</strong>
      <p>${question.explanation}</p>
    </div>
  `;

  $$(".alternative").forEach((button) => {
    button.addEventListener("click", () => answerQuestion(question.id, button.dataset.letter));
  });
}

function renderAlternative(question, alternative, saved) {
  const selected = saved?.letter === alternative.letter;
  const showCorrection = Boolean(saved);
  const correct = question.answer === alternative.letter;
  const classes = [
    "alternative",
    selected ? "selected" : "",
    showCorrection && correct ? "correct" : "",
    showCorrection && selected && !correct ? "wrong" : ""
  ].filter(Boolean).join(" ");

  return `
    <button class="${classes}" type="button" data-letter="${alternative.letter}">
      <span class="alternative-letter">${alternative.letter}</span>
      <span>${alternative.text}</span>
    </button>
  `;
}

function renderStimulus(stimulus) {
  if (!stimulus) return "";

  if (stimulus.type === "table") {
    const cols = stimulus.columns?.length || 3;
    return `
      <section class="stimulus-card">
        <h3>${stimulus.title}</h3>
        <p>${stimulus.text}</p>
        <div class="mini-table" style="--cols: ${cols}">
          <div class="mini-row">${stimulus.columns.map((item) => `<span>${item}</span>`).join("")}</div>
          ${stimulus.rows.map((row) => `<div class="mini-row">${row.map((item) => `<span>${item}</span>`).join("")}</div>`).join("")}
        </div>
      </section>
    `;
  }

  if (stimulus.type === "chart") {
    const max = Math.max(...stimulus.bars.map((bar) => bar.value), 1);
    return `
      <section class="stimulus-card">
        <h3>${stimulus.title}</h3>
        <p>${stimulus.text}</p>
        <div class="chart-bars">
          ${stimulus.bars.map((bar) => `
            <div class="chart-bar-item">
              <span class="chart-bar" style="--h: ${Math.max(18, Math.round((bar.value / max) * 140))}px"></span>
              <strong>${bar.value}</strong>
              <small>${bar.label}</small>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  return `
    <section class="stimulus-card">
      <h3>${stimulus.title}</h3>
      <p>${stimulus.text}</p>
    </section>
  `;
}

function answerQuestion(questionId, letter) {
  const question = state.module.questions.find((item) => item.id === questionId);
  if (!question) return;
  const correct = question.answer === letter;
  const progress = getModuleProgress();
  progress.answers[questionId] = {
    letter,
    correct,
    status: correct ? "correct" : "wrong",
    answeredAt: new Date().toISOString()
  };
  state.progress[state.currentModuleId] = progress;
  saveProgress();
  renderAll();
  showToast(correct ? "Boa, questão correta." : "Quase. Veja a explicação.");
}

function revealAnswer() {
  const question = currentQuestion();
  if (!question) return;
  const progress = getModuleProgress();
  progress.answers[question.id] = {
    letter: question.answer,
    correct: true,
    status: "correct",
    revealed: true,
    answeredAt: new Date().toISOString()
  };
  state.progress[state.currentModuleId] = progress;
  saveProgress();
  renderAll();
}

function toggleFavorite() {
  const question = currentQuestion();
  if (!question) return;
  const progress = getModuleProgress();
  progress.favorites[question.id] = !progress.favorites[question.id];
  state.progress[state.currentModuleId] = progress;
  saveProgress();
  renderQuestion();
  showToast(progress.favorites[question.id] ? "Questão favoritada." : "Favorito removido.");
}

function previousQuestion() {
  const visible = visibleQuestions();
  const current = currentQuestion();
  const visibleIndex = visible.findIndex((question) => question.id === current?.id);
  const target = visible[Math.max(0, visibleIndex - 1)];
  goToQuestion(target);
}

function nextQuestion() {
  const visible = visibleQuestions();
  const current = currentQuestion();
  const visibleIndex = visible.findIndex((question) => question.id === current?.id);
  const target = visible[Math.min(visible.length - 1, visibleIndex + 1)];
  goToQuestion(target);
}

function goToQuestion(question) {
  if (!question) return;
  const index = state.module.questions.findIndex((item) => item.id === question.id);
  if (index >= 0) {
    state.currentIndex = index;
    saveLastIndex();
    renderAll();
  }
}

function continueModule() {
  const firstUnanswered = state.module?.questions.find((question) => !getAnswer(question.id));
  goToQuestion(firstUnanswered || state.module?.questions[0]);
}

function toggleWrongReview() {
  state.reviewWrongOnly = !state.reviewWrongOnly;
  const visible = visibleQuestions();
  if (visible.length) goToQuestion(visible[0]);
  renderAll();
  showToast(state.reviewWrongOnly ? "Revisando apenas erros." : "Mostrando módulo completo.");
}

function visibleQuestions() {
  if (!state.module) return [];
  if (!state.reviewWrongOnly) return state.module.questions;
  return state.module.questions.filter((question) => getAnswer(question.id)?.status === "wrong");
}

function currentQuestion() {
  return state.module?.questions[state.currentIndex] || visibleQuestions()[0];
}

function getQuestionsByArea(area) {
  return state.module?.questions.filter((question) => question.area === area) || [];
}

function renderStats() {
  if (!state.module) return;
  const progress = getModuleProgress();
  const answers = Object.values(progress.answers || {});
  const answered = answers.length;
  const correct = answers.filter((answer) => answer.correct).length;
  const wrong = answered - correct;
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const percent = Math.round((answered / state.module.totalQuestions) * 100);

  $("#statAccuracy").textContent = `${accuracy}%`;
  $("#scoreAccuracy").textContent = `${accuracy}%`;
  $("#scoreAnswered").textContent = answered;
  $("#scoreCorrect").textContent = correct;
  $("#scoreWrong").textContent = wrong;
  $("#sidebarProgress").style.width = `${percent}%`;
  $("#sidebarProgressText").textContent = `${answered} de ${state.module.totalQuestions} questões respondidas.`;
}

function renderAreaPerformance() {
  if (!state.module) return;
  $("#areaPerformance").innerHTML = state.module.structure.map((block) => {
    const questions = getQuestionsByArea(block.area);
    const answered = questions.filter((question) => getAnswer(question.id)).length;
    const correct = questions.filter((question) => getAnswer(question.id)?.correct).length;
    const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
    const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0;

    return `
      <div class="area-performance-row">
        <header>
          <span>${areaLabels[block.area]}</span>
          <strong>${accuracy}%</strong>
        </header>
        <div class="area-track" aria-hidden="true"><span style="width: ${progress}%"></span></div>
        <small>${answered}/${questions.length} respondidas</small>
      </div>
    `;
  }).join("");
}

function saveLastIndex() {
  const progress = getModuleProgress();
  progress.lastIndex = state.currentIndex;
  state.progress[state.currentModuleId] = progress;
  saveProgress();
}

function getAnswer(questionId) {
  return getModuleProgress().answers?.[questionId] || null;
}

function getModuleProgress() {
  if (!state.currentModuleId) return { answers: {}, favorites: {}, lastIndex: 0 };
  return getProgressForModule(state.currentModuleId);
}

function getProgressForModule(moduleId) {
  if (!state.progress[moduleId]) {
    state.progress[moduleId] = { answers: {}, favorites: {}, lastIndex: 0 };
  }
  return state.progress[moduleId];
}

function saveProgress() {
  localStorage.setItem(progressKey, JSON.stringify(state.progress));
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    return null;
  }
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
