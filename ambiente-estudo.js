const settingsKey = "saasEnemSettingsV1";
const lessonProgressKey = "saasEnemStudyLessonProgressV1";
const libraryProgressKey = "saasEnemLibraryProgressV1";

const state = {
  index: [],
  lessonFile: null,
  booklet: null,
  flatLessons: [],
  currentIndex: 0,
  progress: {},
  libraryProgress: {},
  settings: {}
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  state.settings = readJson(settingsKey) || {};
  state.progress = readJson(lessonProgressKey) || {};
  state.libraryProgress = readJson(libraryProgressKey) || {};
  applySettings();
  bindEvents();
  await loadStudyContent();
  renderStudyPage();
  refreshIcons();
}

function bindEvents() {
  $("#mobileMenuButton").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  $("#markLessonButton").addEventListener("click", markCurrentLessonDone);
  $("#previousLessonButton").addEventListener("click", previousLesson);
  $("#nextLessonButton").addEventListener("click", nextLesson);
}

async function loadStudyContent() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  state.index = await fetchJson("data/aulas/aulas-index.json");
  const item = state.index.find((entry) => entry.id === id) || state.index[0];

  if (!item) {
    throw new Error("Nenhuma aula encontrada.");
  }

  state.lessonFile = item.file;
  state.booklet = await fetchJson(item.file);
  state.flatLessons = state.booklet.chapters.flatMap((chapter, chapterIndex) => (
    chapter.lessons.map((lesson, lessonIndex) => ({
      ...lesson,
      chapterTitle: chapter.title,
      chapterIndex,
      lessonIndex,
      globalIndex: 0
    }))
  )).map((lesson, index) => ({ ...lesson, globalIndex: index }));
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}`);
  }

  return response.json();
}

function renderStudyPage() {
  const booklet = state.booklet;
  const completed = getCompletedCount();
  const total = state.flatLessons.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  $("#sidebarTitle").textContent = booklet.title;
  $("#sidebarProgress").style.width = `${percent}%`;
  $("#sidebarProgressText").textContent = `${completed} de ${total} tópicos concluídos.`;
  $("#areaLabel").textContent = `${booklet.areaLabel} / ${booklet.subject}`;
  $("#bookletTitle").textContent = booklet.title;
  $("#bookletSummary").textContent = booklet.summary;
  $("#heroMeta").innerHTML = `
    <span class="meta-pill"><i data-lucide="book-open"></i>${total} aulas</span>
    <span class="meta-pill"><i data-lucide="clock-3"></i>${booklet.estimatedMinutes} min</span>
    <span class="meta-pill"><i data-lucide="check-circle-2"></i>${percent}% concluído</span>
  `;
  $("#beforeStudy").innerHTML = booklet.beforeStudy.map((item) => `<li>${item}</li>`).join("");
  $("#studyPromise").textContent = booklet.studyPromise;
  $("#finalReviewSummary").textContent = booklet.finalReview.summary;
  $("#finalReviewChecklist").innerHTML = booklet.finalReview.checklist.map((item) => `<li>${item}</li>`).join("");

  renderLessonNav();
  renderCurrentLesson();
}

function renderLessonNav() {
  const currentLesson = state.flatLessons[state.currentIndex];
  const pickerOptions = state.booklet.chapters.map((chapter, chapterIndex) => `
    <div class="lesson-picker-group">
      <strong>${escapeHtml(chapter.title)}</strong>
      ${chapter.lessons.map((lesson, lessonIndex) => {
        const globalIndex = getGlobalIndex(chapterIndex, lessonIndex);
        const done = isLessonDone(globalIndex);
        return `
          <button class="lesson-picker-option ${globalIndex === state.currentIndex ? "active" : ""}" type="button" data-lesson-index="${globalIndex}">
            <span>${done ? "✓" : globalIndex + 1}</span>
            <strong>${escapeHtml(lesson.title)}</strong>
          </button>
        `;
      }).join("")}
    </div>
  `).join("");

  const buttonList = state.booklet.chapters.map((chapter, chapterIndex) => `
    <div class="nav-chapter">
      <strong>${chapter.title}</strong>
      ${chapter.lessons.map((lesson, lessonIndex) => {
        const globalIndex = getGlobalIndex(chapterIndex, lessonIndex);
        const done = isLessonDone(globalIndex);
        return `
          <button class="lesson-link ${globalIndex === state.currentIndex ? "active" : ""} ${done ? "done" : ""}" type="button" data-lesson-index="${globalIndex}">
            <span>${done ? "✓" : globalIndex + 1}</span>
            ${lesson.title}
          </button>
        `;
      }).join("")}
    </div>
  `).join("");

  $("#lessonNav").innerHTML = `
    <div class="lesson-picker">
      <button class="lesson-picker-toggle" id="lessonPickerToggle" type="button" aria-expanded="false">
        <span>Topico atual</span>
        <strong>${state.currentIndex + 1}. ${escapeHtml(currentLesson.title)}</strong>
        <i data-lucide="chevron-down"></i>
      </button>
      <div class="lesson-picker-menu" id="lessonPickerMenu">${pickerOptions}</div>
    </div>
    <div class="lesson-button-list">${buttonList}</div>
  `;

  const pickerToggle = $("#lessonPickerToggle");
  if (pickerToggle) {
    pickerToggle.addEventListener("click", () => {
      const picker = pickerToggle.closest(".lesson-picker");
      const isOpen = picker.classList.toggle("open");
      pickerToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  $$(".lesson-picker-option").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentIndex = Number(button.dataset.lessonIndex);
      renderCurrentLesson();
      renderLessonNav();
      refreshIcons();
      document.body.classList.remove("menu-open");
    });
  });

  $$(".lesson-link").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentIndex = Number(button.dataset.lessonIndex);
      renderCurrentLesson();
      renderLessonNav();
      refreshIcons();
      document.body.classList.remove("menu-open");
    });
  });
}

function renderCurrentLesson() {
  const lesson = state.flatLessons[state.currentIndex];

  if (!lesson) {
    return;
  }

  $("#chapterLabel").textContent = lesson.chapterTitle;
  $("#lessonCounter").textContent = `Tópico ${state.currentIndex + 1} de ${state.flatLessons.length}`;
  $("#lessonTitle").textContent = lesson.title;
  $("#plainSummary").textContent = lesson.plainSummary;
  $("#lessonExplanation").innerHTML = lesson.explanation.map((paragraph) => `<p class="lesson-explanation-paragraph">${paragraph}</p>`).join("");
  $("#formulaCards").innerHTML = renderFormulaCards(lesson.formulaCards || []);
  $("#visualModels").innerHTML = renderVisualModels(lesson.visualModels || []);
  $("#howItAppears").innerHTML = lesson.howItAppears.map((item) => `<li>${item}</li>`).join("");
  $("#stepByStep").innerHTML = lesson.stepByStep.map((item) => `<li>${item}</li>`).join("");
  $("#exampleSituation").textContent = lesson.example.situation;
  $("#exampleAnalysis").textContent = lesson.example.analysis;
  $("#exampleAnswer").textContent = lesson.example.answerModel;
  $("#workedExamples").innerHTML = renderWorkedExamples(lesson.workedExamples || []);
  $("#enemQuestions").innerHTML = renderEnemQuestions(lesson.enemStyleQuestions || []);
  $("#studyScript").innerHTML = renderStudyScript(lesson.studyScript);
  $("#commonMistakes").innerHTML = lesson.commonMistakes.map((item) => `<li>${item}</li>`).join("");
  $("#quickReview").innerHTML = lesson.quickReview.map((item) => `<li>${item}</li>`).join("");
  $("#glossaryGrid").innerHTML = renderGlossary(lesson.glossary || []);
  $("#masteryRubric").innerHTML = renderMasteryRubric(lesson.masteryRubric || []);
  $("#practicePrompt").textContent = lesson.miniPractice.prompt;
  $("#practiceFeedback").textContent = "";
  $("#practiceOptions").innerHTML = lesson.miniPractice.options.map((option, index) => `
    <button class="practice-option" type="button" data-option-index="${index}">${option}</button>
  `).join("");

  $$(".practice-option").forEach((button) => {
    button.addEventListener("click", () => answerPractice(Number(button.dataset.optionIndex)));
  });

  $("#previousLessonButton").disabled = state.currentIndex === 0;
  $("#nextLessonButton").innerHTML = state.currentIndex === state.flatLessons.length - 1
    ? 'Finalizar apostila <i data-lucide="check-circle-2"></i>'
    : 'Próximo tópico <i data-lucide="arrow-right"></i>';

  refreshIcons();
}

function renderFormulaCards(cards) {
  return cards.map((card) => `
    <article class="formula-card">
      <strong>${card.name}</strong>
      <code>${card.expression}</code>
      <p>${card.explanation}</p>
      <small>${card.useWhen}</small>
    </article>
  `).join("");
}

function renderVisualModels(models) {
  return models.map((model) => {
    if (model.type === "function-graph") {
      const points = model.points || [];
      const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
      return `
        <article class="visual-card visual-card-wide">
          <h4>${model.title}</h4>
          <p>${model.description || ""}</p>
          <div class="function-graph" role="img" aria-label="${model.title}">
            <svg viewBox="0 0 320 210" preserveAspectRatio="none">
              <line x1="34" y1="176" x2="300" y2="176" class="axis"></line>
              <line x1="34" y1="18" x2="34" y2="176" class="axis"></line>
              <polyline points="${polyline}" class="graph-line"></polyline>
              ${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4" class="graph-point"></circle>`).join("")}
            </svg>
            <div class="graph-caption">${model.caption || ""}</div>
            <div class="graph-update-note">Se o grafico parecer cortado no celular, atualize a pagina ou gire a tela.</div>
          </div>
        </article>
      `;
    }

    if (model.type === "bar-chart") {
      const max = Math.max(...(model.bars || []).map((bar) => Number(bar.value) || 0), 1);
      return `
        <article class="visual-card">
          <h4>${model.title}</h4>
          <p>${model.description || ""}</p>
          <div class="study-bar-chart">
            ${(model.bars || []).map((bar) => {
              const height = Math.max(12, Math.round(((Number(bar.value) || 0) / max) * 100));
              return `
                <div class="study-bar-item">
                  <span class="study-bar" style="--bar-height: ${height}%"></span>
                  <strong>${bar.value}</strong>
                  <small>${bar.label}</small>
                </div>
              `;
            }).join("")}
          </div>
        </article>
      `;
    }

    if (model.type === "timeline") {
      return `
        <article class="visual-card">
          <h4>${model.title}</h4>
          <p>${model.description || ""}</p>
          <ol class="study-timeline">
            ${(model.events || []).map((event) => `
              <li>
                <strong>${event.label}</strong>
                <span>${event.text}</span>
              </li>
            `).join("")}
          </ol>
        </article>
      `;
    }

    if (model.type === "quote-card") {
      return `
        <article class="visual-card quote-visual">
          <h4>${model.title}</h4>
          <blockquote>${model.quote}</blockquote>
          <p>${model.explanation || ""}</p>
          <small>${model.author || ""}</small>
        </article>
      `;
    }

    if (model.type === "cycle-diagram") {
      return `
        <article class="visual-card">
          <h4>${model.title}</h4>
          <p>${model.description || ""}</p>
          <div class="cycle-diagram">
            ${(model.steps || []).map((step, index) => `
              <span style="--step-index: ${index}">${step}</span>
            `).join("")}
          </div>
        </article>
      `;
    }

    if (model.type === "concept-board") {
      return `
        <article class="visual-card">
          <h4>${model.title}</h4>
          <p>${model.description || ""}</p>
          <div class="concept-board">
            ${(model.items || []).map((item) => `
              <section>
                <strong>${item.label}</strong>
                <span>${item.text}</span>
              </section>
            `).join("")}
          </div>
        </article>
      `;
    }

    if (model.type === "comparison-table") {
      return `
        <article class="visual-card">
          <h4>${model.title}</h4>
          <div class="mini-table">
            <div class="mini-table-row mini-table-head">
              ${model.columns.map((column) => `<span>${column}</span>`).join("")}
            </div>
            ${model.rows.map((row) => `
              <div class="mini-table-row">
                ${row.map((cell) => `<span>${cell}</span>`).join("")}
              </div>
            `).join("")}
          </div>
        </article>
      `;
    }

    if (model.type === "mental-map") {
      return `
        <article class="visual-card">
          <h4>${model.title}</h4>
          <div class="mental-map">
            <strong>${model.center}</strong>
            ${model.branches.map((branch) => `<span>${branch}</span>`).join("")}
          </div>
        </article>
      `;
    }

    return `
      <article class="visual-card">
        <h4>${model.title}</h4>
        <p>${model.description || ""}</p>
        <div class="flow-model">
          ${model.nodes.map((node) => `<span>${node}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderWorkedExamples(examples) {
  return examples.map((example) => `
    <article class="worked-card">
      <h4>${example.title}</h4>
      <p>${example.prompt}</p>
      <div class="data-list">
        ${example.data.map((item) => `<span>${item}</span>`).join("")}
      </div>
      <ol>
        ${example.solutionSteps.map((step) => `<li>${step}</li>`).join("")}
      </ol>
      <strong>${example.finalAnswer}</strong>
    </article>
  `).join("");
}

function renderEnemQuestions(questions) {
  return questions.map((question, questionIndex) => `
    <article class="question-card">
      <h4>${question.title}</h4>
      <p>${question.prompt}</p>
      <div class="answer-list">
        ${question.alternatives.map((alternative, index) => `
          <span class="${index === question.answer ? "correct-answer" : ""}">${String.fromCharCode(65 + index)}. ${alternative}</span>
        `).join("")}
      </div>
      <strong>Gabarito: ${String.fromCharCode(65 + question.answer)}</strong>
      <p>${question.explanation}</p>
    </article>
  `).join("");
}

function renderStudyScript(script) {
  if (!script) {
    return "";
  }

  return `
    <p>${script.opening}</p>
    ${script.middle.map((paragraph) => `<p>${paragraph}</p>`).join("")}
    <strong>${script.closing}</strong>
  `;
}

function renderGlossary(items) {
  return items.map((item) => `
    <article class="glossary-card">
      <strong>${item.term}</strong>
      <p>${item.meaning}</p>
      <small>${item.inPlainWords}</small>
    </article>
  `).join("");
}

function renderMasteryRubric(items) {
  return items.map((item) => `
    <article class="rubric-card">
      <strong>${item.level}</strong>
      <p>${item.evidence}</p>
      <small>${item.nextStep}</small>
    </article>
  `).join("");
}

function answerPractice(selectedIndex) {
  const lesson = state.flatLessons[state.currentIndex];
  const correct = selectedIndex === lesson.miniPractice.answer;

  $$(".practice-option").forEach((button) => {
    const optionIndex = Number(button.dataset.optionIndex);
    button.classList.toggle("correct", optionIndex === lesson.miniPractice.answer);
    button.classList.toggle("wrong", optionIndex === selectedIndex && !correct);
  });

  $("#practiceFeedback").textContent = correct
    ? `Boa. ${lesson.miniPractice.explanation}`
    : `Quase. ${lesson.miniPractice.explanation}`;
}

function markCurrentLessonDone() {
  const key = getLessonKey(state.currentIndex);
  state.progress[key] = {
    done: true,
    updatedAt: new Date().toISOString()
  };
  saveJson(lessonProgressKey, state.progress);
  updateLibraryProgress();
  renderStudyPage();
  showToast("Tópico concluído.");
}

function previousLesson() {
  if (state.currentIndex === 0) {
    return;
  }

  state.currentIndex -= 1;
  renderCurrentLesson();
  renderLessonNav();
}

function nextLesson() {
  markCurrentLessonDone();

  if (state.currentIndex < state.flatLessons.length - 1) {
    state.currentIndex += 1;
    renderCurrentLesson();
    renderLessonNav();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  showToast("Apostila finalizada.");
}

function updateLibraryProgress() {
  const completed = getCompletedCount();
  const total = state.flatLessons.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  state.libraryProgress[state.booklet.id] = {
    ...(state.libraryProgress[state.booklet.id] || {}),
    status: percent >= 100 ? "done" : "reading",
    percent,
    updatedAt: new Date().toISOString()
  };
  saveJson(libraryProgressKey, state.libraryProgress);
}

function getCompletedCount() {
  return state.flatLessons.filter((_, index) => isLessonDone(index)).length;
}

function isLessonDone(index) {
  return Boolean(state.progress[getLessonKey(index)]?.done);
}

function getLessonKey(index) {
  return `${state.booklet.id}:${state.flatLessons[index].id}`;
}

function getGlobalIndex(chapterIndex, lessonIndex) {
  return state.flatLessons.findIndex((lesson) => lesson.chapterIndex === chapterIndex && lesson.lessonIndex === lessonIndex);
}

function applySettings() {
  if (state.settings.theme === "dark") {
    state.settings.theme = "light";
    saveJson(settingsKey, state.settings);
  }

  document.body.dataset.theme = "light";
  document.body.dataset.motion = state.settings.motion ? "reduced" : "full";
}

function showToast(message) {
  $("#toastText").textContent = message;
  $("#toast").classList.add("show");
  refreshIcons();
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    $("#toast").classList.remove("show");
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

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value = "") {
  return escapeHtml(value);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
