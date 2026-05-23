const planFile = "data/plano/plano-30-dias.json?v=plano-30-1";
const profileKey = "saasEnemStudentProfileV2";
const progressKey = "saasEnemPlan30ProgressV1";

const areaLabels = {
  matematica: "Matemática",
  linguagens: "Linguagens",
  humanas: "Humanas",
  natureza: "Natureza",
  redacao: "Redação",
  questoes: "Questões",
  revisao: "Revisão"
};

const typeLabels = {
  apostila: "Apostila",
  quiz: "Quiz",
  revisao: "Revisão",
  redacao: "Redação"
};

const state = {
  basePlan: null,
  plan: null,
  profile: null,
  progress: null,
  selectedDay: 1,
  areaFilter: "all"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  state.profile = readJson(profileKey);
  state.progress = normalizeProgress(readJson(progressKey));
  await loadPlan();
  bindEvents();
  selectBestInitialDay();
  renderAll();
  refreshIcons();
}

async function loadPlan() {
  try {
    const response = await fetch(planFile);
    if (!response.ok) throw new Error("Plano não carregado.");
    state.basePlan = await response.json();
    state.plan = buildPersonalizedPlan(state.basePlan, state.profile);
  } catch (error) {
    state.basePlan = { days: [] };
    state.plan = { days: [], personalization: defaultPersonalization() };
    showToast("Não foi possível carregar o plano de 30 dias.");
  }
}

function bindEvents() {
  $("#continueButton").addEventListener("click", continuePlan);
  $("#startTodayButton").addEventListener("click", continuePlan);
  $("#markCurrentDayButton").addEventListener("click", completeSelectedDay);
  $("#clearDayButton").addEventListener("click", clearSelectedDay);
  $("#resetPlanButton").addEventListener("click", resetPlan);
}

function selectBestInitialDay() {
  const firstOpen = state.plan.days.find((day) => !isDayComplete(day.day));
  state.selectedDay = firstOpen?.day || 30;
}

function renderAll() {
  renderHero();
  renderStats();
  renderFilters();
  renderCalendar();
  renderSelectedDay();
  renderAreaProgress();
  refreshIcons();
}

function renderHero() {
  const personalization = state.plan.personalization;
  $("#heroTitle").textContent = state.profile
    ? `Seu ciclo de 30 dias foi montado para ${personalization.focusLabel}.`
    : "Um mês de estudo com metas pequenas e consistentes.";
  $("#heroText").textContent = state.profile
    ? `${personalization.strategy} Rotina em modo ${personalization.intensityLabel}, melhor para estudar no período de ${personalization.shiftLabel.toLowerCase()}.`
    : "Responda o diagnóstico no dashboard para personalizar a prioridade do ciclo. O plano completo já está disponível.";
  $("#planProfileTags").innerHTML = getPlanTags(personalization).map((tag) => `<span class="profile-tag">${tag}</span>`).join("");
}

function getPlanTags(personalization) {
  if (!state.profile) return ["Plano padrão", "Progresso zerado", "Todas as áreas"];
  return [
    personalization.focusLabel,
    `Curso: ${getCourseLabel(personalization.course)}`,
    `Intensidade: ${personalization.intensityLabel}`,
    `Dificuldade: ${getDifficultyLabel(personalization.difficulty)}`,
    `Melhor turno: ${personalization.shiftLabel}`
  ];
}

function buildPersonalizedPlan(basePlan, profile) {
  if (!basePlan?.days?.length) return { ...basePlan, days: [], personalization: defaultPersonalization() };

  const personalization = profile ? getPersonalization(profile) : defaultPersonalization();
  const orderedDays = profile ? reorderDays(basePlan.days, personalization) : [...basePlan.days];
  const days = orderedDays.map((day, index) => personalizeDay(day, index + 1, personalization));

  return {
    ...basePlan,
    days,
    personalization
  };
}

function defaultPersonalization() {
  return {
    focusAreas: ["matematica", "linguagens", "natureza", "humanas", "redacao", "questoes"],
    focusLabel: "uma trilha equilibrada",
    intensityLabel: "equilibrado",
    shiftLabel: "turno flexível",
    dailyMinutes: null,
    strategy: "Sem diagnóstico salvo, o plano mantém todas as áreas equilibradas.",
    difficulty: "geral",
    objective: "aprovar",
    course: "indeciso"
  };
}

function getPersonalization(profile) {
  const answers = profile.answers || {};
  const focusAreas = getAreaSequence(answers);
  return {
    focusAreas,
    focusLabel: profile.areaFocus || areaLabels[focusAreas[0]] || "sua área prioritária",
    intensityLabel: getIntensityLabel(answers.time),
    shiftLabel: getShiftLabel(answers.shift),
    dailyMinutes: getMinutesByTime(answers.time),
    strategy: getStrategyText(answers, profile.areaFocus),
    difficulty: answers.difficulty || "geral",
    objective: answers.objective || "aprovar",
    course: answers.course || "indeciso"
  };
}

function getAreaSequence(answers) {
  const sequence = [];
  const add = (area) => {
    if (area && !sequence.includes(area)) sequence.push(area);
  };

  add(answers.area);

  const byCourse = {
    medicina: ["natureza", "redacao", "questoes", "matematica"],
    engenharia: ["matematica", "natureza", "questoes", "redacao"],
    direito: ["humanas", "redacao", "linguagens", "questoes"],
    licenciatura: ["linguagens", "humanas", "redacao", "questoes"],
    tecnologia: ["matematica", "natureza", "questoes", "linguagens"],
    indeciso: ["matematica", "linguagens", "natureza", "humanas"]
  };

  (byCourse[answers.course] || []).forEach(add);

  if (answers.objective === "redacao") add("redacao");
  if (answers.difficulty === "questoes" || answers.difficulty === "ansiedade") add("questoes");
  if (answers.difficulty === "base") add("revisao");

  ["matematica", "linguagens", "natureza", "humanas", "redacao", "questoes", "revisao"].forEach(add);
  return sequence;
}

function reorderDays(days, personalization) {
  const pool = days.map((day, index) => ({ ...day, originalIndex: index }));
  const ordered = [];
  const pattern = buildAreaPattern(personalization);

  pattern.forEach((desiredArea) => {
    const index = pool.findIndex((day) => day.area === desiredArea);
    if (index >= 0) {
      ordered.push(pool.splice(index, 1)[0]);
      return;
    }

    const fallbackIndex = pool.findIndex((day) => personalization.focusAreas.includes(day.area));
    ordered.push(pool.splice(fallbackIndex >= 0 ? fallbackIndex : 0, 1)[0]);
  });

  return ordered.concat(pool);
}

function buildAreaPattern(personalization) {
  const primary = personalization.focusAreas[0] || "matematica";
  const secondary = personalization.focusAreas[1] || "linguagens";
  const tertiary = personalization.focusAreas[2] || "natureza";
  const practice = personalization.difficulty === "questoes" || personalization.difficulty === "ansiedade" ? "questoes" : "redacao";
  const review = personalization.difficulty === "base" || personalization.difficulty === "tempo" ? "revisao" : "questoes";
  const pattern = [];

  for (let block = 0; block < 5; block += 1) {
    pattern.push(primary, secondary, primary, tertiary, practice, review);
  }

  return pattern.slice(0, 30);
}

function personalizeDay(day, newDayNumber, personalization) {
  const isPersonalFocus = personalization.focusAreas.slice(0, 3).includes(day.area);
  const minutes = personalization.dailyMinutes || day.minutes;
  const focusPrefix = isPersonalFocus ? "Prioridade do diagnóstico: " : "";
  const difficultyNote = getDifficultyInstruction(personalization.difficulty);

  return {
    ...day,
    day: newDayNumber,
    minutes,
    isPersonalFocus,
    title: `${focusPrefix}${day.title}`,
    personalGoal: `${day.goal} ${difficultyNote}`,
    tasks: day.tasks.map((task, index) => personalizeTask(task, newDayNumber, index, personalization, day.area))
  };
}

function personalizeTask(task, dayNumber, index, personalization, area) {
  const prefixByDifficulty = {
    tempo: "Versão objetiva: ",
    base: task.type === "apostila" ? "Base guiada: " : "",
    questoes: task.type === "quiz" ? "Correção de erros: " : "",
    ansiedade: task.type === "quiz" || area === "questoes" ? "Com calma e tempo marcado: " : ""
  };

  const redacaoBoost = personalization.objective === "redacao" && task.type === "redacao"
    ? "Prioridade máxima: "
    : "";

  return {
    ...task,
    id: `p${dayNumber}-${task.type}-${index + 1}`,
    label: `${redacaoBoost}${prefixByDifficulty[personalization.difficulty] || ""}${task.label}`
  };
}

function getIntensityLabel(time) {
  const labels = {
    "30min": "leve",
    "1h": "equilibrado",
    "2h": "forte",
    "3h": "intenso"
  };
  return labels[time] || "equilibrado";
}

function getMinutesByTime(time) {
  const minutes = {
    "30min": "25-40 min",
    "1h": "45-65 min",
    "2h": "70-100 min",
    "3h": "100-150 min"
  };
  return minutes[time] || null;
}

function getShiftLabel(shift) {
  const labels = {
    manha: "Manhã",
    tarde: "Tarde",
    noite: "Noite",
    variavel: "Turno flexível"
  };
  return labels[shift] || "Turno flexível";
}

function getStrategyText(answers, areaFocus) {
  const difficulty = {
    tempo: "A sequência começa com blocos mais objetivos para criar constância antes de subir a carga.",
    base: "A sequência puxa mais teoria essencial e revisão para reconstruir base antes da prática pesada.",
    questoes: "A sequência antecipa blocos de questões e caderno de erros para transformar erro em revisão.",
    ansiedade: "A sequência usa prática progressiva e tempo marcado para ganhar segurança sem travar."
  };

  const objective = {
    aprovar: "O ciclo prioriza consistência e cobertura ampla para aprovação.",
    nota: "O ciclo prioriza ganho de pontos por área e revisão de lacunas.",
    rotina: "O ciclo prioriza hábito diário com metas pequenas e repetíveis.",
    redacao: "O ciclo aumenta a presença de redação, repertório e intervenção."
  };

  return `${objective[answers.objective] || "O ciclo mantém uma preparação ampla."} ${difficulty[answers.difficulty] || ""} Foco inicial: ${areaFocus || "trilha geral"}.`;
}

function getDifficultyInstruction(difficulty) {
  const notes = {
    tempo: "Se o dia estiver corrido, faça pelo menos a primeira tarefa e mantenha a sequência.",
    base: "Leia sem pressa e explique o conceito com suas palavras antes do quiz.",
    questoes: "Depois de responder, registre exatamente por que errou ou acertou.",
    ansiedade: "Use cronômetro leve, respire antes do bloco e priorize precisão."
  };
  return notes[difficulty] || "Feche o dia marcando o que foi feito e deixando a próxima ação pronta.";
}

function getCourseLabel(course) {
  const labels = {
    medicina: "Medicina",
    engenharia: "Engenharia",
    direito: "Direito",
    licenciatura: "Licenciatura",
    tecnologia: "Tecnologia",
    indeciso: "Ainda decidindo"
  };
  return labels[course] || "Não definido";
}

function getDifficultyLabel(difficulty) {
  const labels = {
    tempo: "Organizar tempo",
    base: "Base fraca",
    questoes: "Errar questões",
    ansiedade: "Ansiedade na prova",
    geral: "Geral"
  };
  return labels[difficulty] || "Geral";
}

function renderStats() {
  const completedDays = getCompletedDaysCount();
  const totalTasks = getAllTasks().length;
  const completedTasks = getCompletedTasksCount();
  const taskPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const streak = calculateStreak(state.progress.studyDates);
  const dayPercent = Math.round((completedDays / 30) * 100);

  $("#statCompleted").textContent = completedDays;
  $("#statStreak").textContent = streak.current;
  $("#statTasks").textContent = `${taskPercent}%`;
  $("#ringPercent").textContent = `${dayPercent}%`;
  $("#sidebarPlanProgress").textContent = `${completedDays}/30 dias`;
  $("#sidebarProgress").style.width = `${dayPercent}%`;
  $("#sidebarStreak").textContent = streak.current
    ? `${streak.current} dias de sequência. Último estudo: ${formatShortDate(streak.lastDate)}.`
    : "Sequência ainda não iniciada.";
}

function renderFilters() {
  const areas = ["all", ...new Set(state.plan.days.map((day) => day.area))];
  $("#areaFilters").innerHTML = areas.map((area) => `
    <button class="filter-chip ${state.areaFilter === area ? "active" : ""}" type="button" data-area-filter="${area}">
      ${area === "all" ? "Todos" : areaLabels[area]}
    </button>
  `).join("");

  $$("[data-area-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.areaFilter = button.dataset.areaFilter;
      renderFilters();
      renderCalendar();
    });
  });
}

function renderCalendar() {
  const preferred = getPreferredArea();
  const days = state.plan.days.filter((day) => state.areaFilter === "all" || day.area === state.areaFilter);
  $("#calendarGrid").innerHTML = days.map((day) => {
    const done = isDayComplete(day.day);
    const selected = day.day === state.selectedDay;
    const recommended = day.area === preferred || day.isPersonalFocus;
    return `
      <button class="calendar-day ${done ? "done" : ""} ${selected ? "active" : ""}" type="button" data-day="${day.day}">
        <span class="day-number">${day.day}</span>
        <span class="area-pill">${areaLabels[day.area] || day.area}</span>
        <strong>${day.title}</strong>
        <small>${recommended ? "Prioridade do seu diagnóstico. " : ""}${day.minutes}</small>
      </button>
    `;
  }).join("");

  $$("[data-day]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDay = Number(button.dataset.day);
      renderCalendar();
      renderSelectedDay();
      document.querySelector("#dayDetail").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderSelectedDay() {
  const day = getSelectedDay();
  if (!day) return;
  $("#dayPhase").textContent = `Dia ${day.day} · ${day.phase}`;
  $("#dayTitle").textContent = day.title;
  $("#dayGoal").textContent = day.personalGoal || day.goal;
  $("#dayTime").textContent = day.minutes;
  $("#taskChecklist").innerHTML = day.tasks.map((task) => {
    const done = isTaskComplete(task.id);
    return `
      <article class="task-item ${done ? "done" : ""}">
        <button class="task-check" type="button" data-toggle-task="${task.id}" aria-label="Marcar tarefa">
          <i data-lucide="${done ? "check" : "circle"}"></i>
        </button>
        <div class="task-copy">
          <strong>${task.label}</strong>
          <span>${typeLabels[task.type] || task.type}</span>
        </div>
        <div class="task-actions">
          ${task.href ? `<a class="ghost-button compact" href="${task.href}"><i data-lucide="arrow-up-right"></i> Abrir</a>` : ""}
        </div>
      </article>
    `;
  }).join("");

  $$("[data-toggle-task]").forEach((button) => {
    button.addEventListener("click", () => toggleTask(button.dataset.toggleTask));
  });
}

function renderAreaProgress() {
  const groups = {};
  state.plan.days.forEach((day) => {
    groups[day.area] ||= { total: 0, done: 0 };
    groups[day.area].total += 1;
    if (isDayComplete(day.day)) groups[day.area].done += 1;
  });

  $("#areaProgress").innerHTML = Object.entries(groups).map(([area, data]) => {
    const percent = Math.round((data.done / data.total) * 100);
    return `
      <div class="progress-item">
        <div class="progress-head"><span>${areaLabels[area] || area}</span><strong>${data.done}/${data.total}</strong></div>
        <div class="bar-track" aria-hidden="true"><span style="width:${percent}%"></span></div>
      </div>
    `;
  }).join("");
}

function toggleTask(taskId) {
  state.progress.tasks[taskId] = !state.progress.tasks[taskId];
  recordStudyDate();
  updateDayCompletionFromTasks();
  saveProgress();
  renderAll();
  showToast(state.progress.tasks[taskId] ? "Tarefa concluída." : "Tarefa reaberta.");
}

function updateDayCompletionFromTasks() {
  const day = getSelectedDay();
  const allDone = day.tasks.every((task) => isTaskComplete(task.id));
  if (allDone) state.progress.days[day.day] = true;
  if (!allDone) delete state.progress.days[day.day];
}

function completeSelectedDay() {
  const day = getSelectedDay();
  day.tasks.forEach((task) => {
    state.progress.tasks[task.id] = true;
  });
  state.progress.days[day.day] = true;
  recordStudyDate();
  saveProgress();
  renderAll();
  showToast(`Dia ${day.day} concluído.`);
}

function clearSelectedDay() {
  const day = getSelectedDay();
  day.tasks.forEach((task) => {
    delete state.progress.tasks[task.id];
  });
  delete state.progress.days[day.day];
  saveProgress();
  renderAll();
  showToast(`Dia ${day.day} limpo.`);
}

function continuePlan() {
  const firstOpen = state.plan.days.find((day) => !isDayComplete(day.day));
  state.selectedDay = firstOpen?.day || 30;
  renderAll();
  document.querySelector("#dayDetail").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetPlan() {
  const ok = window.confirm("Reiniciar todo o progresso do plano de 30 dias?");
  if (!ok) return;
  state.progress = normalizeProgress(null);
  saveProgress();
  selectBestInitialDay();
  renderAll();
  showToast("Plano reiniciado.");
}

function recordStudyDate() {
  const today = toDateKey(new Date());
  state.progress.studyDates = [...new Set([...(state.progress.studyDates || []), today])].sort();
  state.progress.lastActivity = new Date().toISOString();
}

function getSelectedDay() {
  return state.plan.days.find((day) => day.day === state.selectedDay) || state.plan.days[0];
}

function isTaskComplete(taskId) {
  return Boolean(state.progress.tasks[taskId]);
}

function isDayComplete(dayNumber) {
  return Boolean(state.progress.days[dayNumber]);
}

function getCompletedDaysCount() {
  return Object.values(state.progress.days).filter(Boolean).length;
}

function getAllTasks() {
  return state.plan.days.flatMap((day) => day.tasks);
}

function getCompletedTasksCount() {
  return getAllTasks().filter((task) => isTaskComplete(task.id)).length;
}

function getPreferredArea() {
  const area = state.profile?.answers?.area;
  if (area) return area;
  const focus = normalize(state.profile?.areaFocus || "");
  if (focus.includes("matematica")) return "matematica";
  if (focus.includes("natureza")) return "natureza";
  if (focus.includes("humanas")) return "humanas";
  if (focus.includes("linguagens")) return "linguagens";
  if (focus.includes("redacao")) return "redacao";
  return "matematica";
}

function getPreferredAreaLabel() {
  return areaLabels[getPreferredArea()] || "sua área prioritária";
}

function normalizeProgress(progress) {
  return {
    tasks: progress?.tasks || {},
    days: progress?.days || {},
    studyDates: progress?.studyDates || [],
    lastActivity: progress?.lastActivity || null
  };
}

function calculateStreak(studyDates) {
  const dates = [...new Set(studyDates || [])].sort();
  if (!dates.length) return { current: 0, lastDate: null };
  const set = new Set(dates);
  const today = new Date();
  let cursor = set.has(toDateKey(today)) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(toDateKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return { current: count, lastDate: dates[dates.length - 1] };
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatShortDate(dateKey) {
  if (!dateKey) return "sem registro";
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
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

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function showToast(message) {
  $("#toastText").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $("#toast").classList.remove("show"), 2200);
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
