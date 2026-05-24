const storageKey = "saasEnemStudentProfileV2";
const taskKey = "saasEnemTaskStateV2";
const settingsKey = "saasEnemSettingsV1";
const planProgressKey = "saasEnemPlan30ProgressV1";

const defaultSettings = {
  theme: "light",
  motion: false,
  contrast: false,
  reminders: true,
  showProgress: true,
  density: "comfortable"
};

const questions = [
  {
    id: "name",
    type: "input",
    title: "Como devemos chamar você?",
    hint: "Use seu primeiro nome ou um apelido. Isso deixa o portal mais seu.",
    placeholder: "Ex: Ana, Pedro, Luiza"
  },
  {
    id: "objective",
    title: "Qual é seu objetivo principal com a plataforma?",
    hint: "Vamos usar isso para definir a linguagem das metas e o tipo de cobrança.",
    options: [
      { value: "aprovar", label: "Ser aprovado no ENEM", detail: "Quero uma rotina forte para disputar uma vaga.", icon: "trophy" },
      { value: "nota", label: "Aumentar minha nota", detail: "Quero evoluir por área e corrigir lacunas.", icon: "trending-up" },
      { value: "rotina", label: "Criar disciplina", detail: "Quero constância, metas simples e acompanhamento.", icon: "calendar-check" },
      { value: "redacao", label: "Dominar redação", detail: "Quero repertório, estrutura e correção frequente.", icon: "pen-tool" }
    ]
  },
  {
    id: "course",
    title: "Você quer fazer qual curso?",
    hint: "O curso ajuda a calibrar intensidade, prioridade de competências e tom do plano.",
    options: [
      { value: "medicina", label: "Medicina", detail: "Alta concorrência, rotina intensa e revisão constante.", icon: "heart-pulse" },
      { value: "engenharia", label: "Engenharia", detail: "Foco em matemática, natureza e resolução rápida.", icon: "drafting-compass" },
      { value: "direito", label: "Direito", detail: "Humanas, linguagem, atualidades e redação forte.", icon: "scale" },
      { value: "licenciatura", label: "Licenciatura", detail: "Base ampla, leitura e consistência semanal.", icon: "graduation-cap" },
      { value: "tecnologia", label: "Tecnologia", detail: "Matemática, lógica, natureza e interpretação.", icon: "cpu" },
      { value: "indeciso", label: "Ainda estou decidindo", detail: "Vamos montar uma preparação equilibrada.", icon: "compass" }
    ]
  },
  {
    id: "area",
    title: "Qual área de estudo mais te interessa?",
    hint: "O dashboard destaca os módulos e tarefas que combinam com seu interesse inicial.",
    options: [
      { value: "linguagens", label: "Linguagens e redação", detail: "Interpretação, repertório, texto e argumentação.", icon: "languages" },
      { value: "humanas", label: "Ciências humanas", detail: "História, geografia, sociologia e filosofia.", icon: "landmark" },
      { value: "natureza", label: "Ciências da natureza", detail: "Biologia, química, física e investigação.", icon: "atom" },
      { value: "matematica", label: "Matemática", detail: "Problemas, gráficos, porcentagem e funções.", icon: "calculator" }
    ]
  },
  {
    id: "difficulty",
    title: "Hoje, qual parte mais trava seu estudo?",
    hint: "Isso vira prioridade no mapa de foco e nos primeiros atalhos.",
    options: [
      { value: "tempo", label: "Organizar tempo", detail: "Tenho dificuldade para manter frequência.", icon: "clock-3" },
      { value: "base", label: "Base fraca", detail: "Preciso recomeçar com explicações diretas.", icon: "blocks" },
      { value: "questoes", label: "Errar questões", detail: "Quero entender meus erros e revisar melhor.", icon: "badge-help" },
      { value: "ansiedade", label: "Ansiedade na prova", detail: "Preciso treinar ritmo, segurança e simulado.", icon: "activity" }
    ]
  },
  {
    id: "time",
    title: "Quanto tempo você consegue estudar por dia?",
    hint: "Não precisa exagerar. O melhor plano é o que você consegue repetir.",
    options: [
      { value: "30min", label: "30 minutos", detail: "Rotina leve com uma ação principal por dia.", icon: "timer" },
      { value: "1h", label: "1 hora", detail: "Bloco diário com teoria, questão e revisão curta.", icon: "clock" },
      { value: "2h", label: "2 horas", detail: "Dois blocos com prática e correção.", icon: "hourglass" },
      { value: "3h", label: "3 horas ou mais", detail: "Plano intenso com metas por competência.", icon: "rocket" }
    ]
  },
  {
    id: "shift",
    title: "Em qual turno você rende melhor?",
    hint: "A agenda sugerida usa esse dado para organizar tarefas pesadas e revisões.",
    options: [
      { value: "manha", label: "Manhã", detail: "Começar cedo e proteger o resto do dia.", icon: "sunrise" },
      { value: "tarde", label: "Tarde", detail: "Blocos depois da escola, curso ou trabalho.", icon: "sun" },
      { value: "noite", label: "Noite", detail: "Ritmo concentrado com revisão guiada.", icon: "moon" },
      { value: "variavel", label: "Varia muito", detail: "Plano flexível com metas pequenas.", icon: "shuffle" }
    ]
  },
  {
    id: "source",
    title: "Como você conheceu nossa plataforma?",
    hint: "Essa resposta fica salva no perfil e ajuda a entender sua entrada no portal.",
    options: [
      { value: "instagram", label: "Instagram ou TikTok", detail: "Vi conteúdo curto ou indicação em rede social.", icon: "smartphone" },
      { value: "amigo", label: "Indicação de amigo", detail: "Alguém me recomendou estudar por aqui.", icon: "users" },
      { value: "escola", label: "Escola ou professor", detail: "Cheguei por orientação de estudo.", icon: "school" },
      { value: "pesquisa", label: "Pesquisa na internet", detail: "Encontrei procurando ajuda para o ENEM.", icon: "search" }
    ]
  }
];

const modules = [
  {
    id: "biblioteca",
    title: "Biblioteca de apostilas",
    href: "biblioteca.html",
    icon: "library",
    description: "Apostilas por área, dificuldade, prioridade e progresso de leitura.",
    progress: 0
  },
  {
    id: "quiz",
    title: "Quiz por matéria",
    href: "quiz.html",
    icon: "messages-square",
    description: "Perguntas por assunto com acertos, erros, explicação e revisão.",
    progress: 0
  },
  {
    id: "questoes",
    title: "Questões frequentes",
    href: "questoes.html",
    icon: "badge-help",
    description: "Temas recorrentes do ENEM, exemplos e estratégias de resolução.",
    progress: 0
  },
  {
    id: "redacao",
    title: "Laboratório de redação",
    href: "redacao.html",
    icon: "pen-tool",
    description: "Upload, editor próprio, repertório, técnicas e avaliação por competência.",
    progress: 0
  },
  {
    id: "plano",
    title: "Plano de 30 dias",
    href: "plano-estudos.html",
    icon: "calendar-days",
    description: "Calendário simples, checklist diário, metas e retomada de progresso.",
    progress: 0
  },
  {
    id: "simulados",
    title: "Simulados inteligentes",
    href: "questoes.html",
    icon: "clipboard-check",
    description: "Treinos por tempo, revisão de erros e recomendação do próximo assunto.",
    progress: 0
  }
];

const weekModes = {
  balanced: [
    ["Segunda", "Base da área prioritária", "45-70 min"],
    ["Terça", "Quiz com revisão de erros", "35-60 min"],
    ["Quarta", "Redação: repertório e tese", "45-70 min"],
    ["Quinta", "Questões ENEM recorrentes", "35-60 min"],
    ["Sexta", "Checklist e revisão ativa", "30-50 min"]
  ],
  intense: [
    ["Segunda", "Teoria + lista guiada", "90-140 min"],
    ["Terça", "Matemática e natureza", "90-140 min"],
    ["Quarta", "Redação completa", "80-120 min"],
    ["Quinta", "Simulado por assunto", "90-140 min"],
    ["Sexta", "Correção e caderno de erros", "70-110 min"]
  ],
  review: [
    ["Segunda", "Flash revisão da semana", "25-45 min"],
    ["Terça", "Erros mais frequentes", "25-45 min"],
    ["Quarta", "Leitura e repertório", "25-45 min"],
    ["Quinta", "Questões rápidas", "25-45 min"],
    ["Sexta", "Resumo e ajuste da meta", "25-45 min"]
  ]
};

const state = {
  step: 0,
  answers: {},
  acceptedTerms: false,
  profile: null,
  tasks: {},
  weekMode: "balanced",
  settings: { ...defaultSettings }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  screenDim: $("#screenDim"),
  onboarding: $("#onboarding"),
  questionForm: $("#questionForm"),
  questionStage: $("#questionStage"),
  previousQuestionButton: $("#previousQuestionButton"),
  nextQuestionButton: $("#nextQuestionButton"),
  questionStepLabel: $("#questionStepLabel"),
  questionProgressBar: $("#questionProgressBar"),
  builder: $("#builder"),
  builderText: $("#builderText"),
  settingsPanel: $("#settingsPanel"),
  toast: $("#toast"),
  toastText: $("#toastText")
};

function init() {
  state.profile = readJson(storageKey);
  state.tasks = readJson(taskKey) || {};
  state.settings = { ...defaultSettings, ...(readJson(settingsKey) || {}) };
  applySettings();
  exposeProfileApi();
  bindEvents();
  renderDashboard();

  if (!state.profile) {
    setTimeout(() => openOnboarding(), 500);
  }

  refreshIcons();
}

function exposeProfileApi() {
  window.SaasEnemProfile = {
    storageKey,
    taskKey,
    settingsKey,
    getProfile() {
      return readJson(storageKey);
    },
    getAnswers() {
      const profile = readJson(storageKey);
      return profile ? profile.answers : null;
    },
    getFocusDistribution() {
      const profile = readJson(storageKey);
      return profile ? profile.focus : null;
    },
    getRecommendedTasks() {
      const profile = readJson(storageKey);
      return profile ? profile.tasks : null;
    },
    buildFromAnswers(answers) {
      return buildProfile(answers);
    },
    getSettings() {
      return { ...defaultSettings, ...(readJson(settingsKey) || {}) };
    },
    clear() {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(taskKey);
      localStorage.removeItem(settingsKey);
    }
  };
}

function bindEvents() {
  $("#openSettingsNavButton").addEventListener("click", openSettings);
  $("#openOnboardingButton").addEventListener("click", openOnboarding);
  $("#heroCtaButton").addEventListener("click", handleHeroCta);
  $("#closeOnboardingButton").addEventListener("click", closeOnboarding);
  $("#closeSettingsButton").addEventListener("click", closeSettings);
  $("#resetProfileButton").addEventListener("click", resetProfile);
  $("#shuffleTasksButton").addEventListener("click", shuffleTasks);
  $("#mobileMenuButton").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  $("#editNameButton").addEventListener("click", editName);
  $("#exportProfileButton").addEventListener("click", exportProfile);
  $("#clearTasksButton").addEventListener("click", clearTasks);
  $("#clearAllButton").addEventListener("click", clearAllData);

  elements.screenDim.addEventListener("click", () => {
    closeOnboarding();
    closeSettings();
    document.body.classList.remove("menu-open");
  });

  elements.previousQuestionButton.addEventListener("click", () => {
    if (state.step > 0) {
      state.step -= 1;
      renderQuestion();
    }
  });

  elements.nextQuestionButton.addEventListener("click", () => {
    const question = questions[state.step];

    if (!state.answers[question.id]) {
      showToast("Escolha uma resposta para continuar.");
      return;
    }

    if (state.step < questions.length - 1) {
      state.step += 1;
      renderQuestion();
      return;
    }

    if (!state.acceptedTerms) {
      showToast("Aceite os termos de uso e serviço para criar seu modelo.");
      return;
    }

    finishOnboarding();
  });

  $$("[data-week-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.weekMode = button.dataset.weekMode;
      $$("[data-week-mode]").forEach((item) => item.classList.toggle("active", item === button));
      renderWeekBoard();
      showToast("Rotina semanal atualizada.");
    });
  });

  $$("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.themeChoice === "dark") {
        updateSettings({ theme: "light" });
        showToast("Modo escuro em manutenção. Ele será liberado em breve.");
        return;
      }

      updateSettings({ theme: button.dataset.themeChoice });
      showToast("Tema claro aplicado.");
    });
  });

  $("#motionToggle").addEventListener("change", (event) => {
    updateSettings({ motion: event.target.checked });
  });

  $("#contrastToggle").addEventListener("change", (event) => {
    updateSettings({ contrast: event.target.checked });
  });

  $("#reminderToggle").addEventListener("change", (event) => {
    updateSettings({ reminders: event.target.checked });
  });

  $("#progressToggle").addEventListener("change", (event) => {
    updateSettings({ showProgress: event.target.checked });
    renderModules(state.profile ? state.profile.answers : {}, Boolean(state.profile));
    refreshIcons();
  });

  $("#densitySelect").addEventListener("change", (event) => {
    updateSettings({ density: event.target.value });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeOnboarding();
      closeSettings();
      document.body.classList.remove("menu-open");
    }
  });
}

function openSettings() {
  elements.settingsPanel.classList.add("show");
  elements.screenDim.classList.add("show");
  document.body.classList.add("modal-open");
  document.body.classList.remove("menu-open");
  renderSettingsPanel();
  refreshIcons();
}

function handleHeroCta() {
  if (state.profile) {
    window.location.href = "plano-estudos.html";
    return;
  }

  openOnboarding();
}

function closeSettings() {
  elements.settingsPanel.classList.remove("show");

  if (!elements.onboarding.classList.contains("show")) {
    elements.screenDim.classList.remove("show");
    document.body.classList.remove("modal-open");
  }
}

function openOnboarding() {
  elements.settingsPanel.classList.remove("show");
  state.step = 0;
  state.answers = state.profile ? { ...state.profile.answers } : {};
  state.acceptedTerms = Boolean(state.profile?.termsAccepted);
  elements.questionForm.style.display = "block";
  elements.builder.classList.remove("show");
  elements.onboarding.classList.add("show");
  elements.screenDim.classList.add("show");
  document.body.classList.add("modal-open");
  renderQuestion();
}

function closeOnboarding() {
  elements.onboarding.classList.remove("show");

  if (!elements.settingsPanel.classList.contains("show")) {
    elements.screenDim.classList.remove("show");
    document.body.classList.remove("modal-open");
  }
}

function renderQuestion() {
  const question = questions[state.step];
  const currentValue = state.answers[question.id] || "";
  const progress = ((state.step + 1) / questions.length) * 100;
  const termsConsent = state.step === questions.length - 1 ? renderTermsConsent() : "";

  elements.questionStepLabel.textContent = `Pergunta ${state.step + 1} de ${questions.length}`;
  elements.questionProgressBar.style.width = `${progress}%`;
  elements.previousQuestionButton.disabled = state.step === 0;
  elements.nextQuestionButton.innerHTML = state.step === questions.length - 1
    ? 'Criar modelo <i data-lucide="wand-sparkles"></i>'
    : 'Continuar <i data-lucide="arrow-right"></i>';

  if (question.type === "input") {
    elements.questionStage.innerHTML = `
      <div class="question-card">
        <h3>${question.title}</h3>
        <p>${question.hint}</p>
        <input class="name-input" id="nameInput" type="text" maxlength="28" value="${escapeHtml(currentValue)}" placeholder="${question.placeholder}" autocomplete="given-name">
        ${termsConsent}
      </div>
    `;

    const input = $("#nameInput");
    input.focus();
    input.addEventListener("input", () => {
      state.answers[question.id] = input.value.trim();
    });
    bindTermsConsent();
    refreshIcons();
    return;
  }

  elements.questionStage.innerHTML = `
    <div class="question-card">
      <h3>${question.title}</h3>
      <p>${question.hint}</p>
      <div class="options-grid">
        ${question.options.map((option) => `
          <button class="option-card ${currentValue === option.value ? "selected" : ""}" type="button" data-question="${question.id}" data-value="${option.value}" aria-pressed="${currentValue === option.value}">
            <i data-lucide="${option.icon}"></i>
            <strong>${option.label}</strong>
            <span>${option.detail}</span>
            <span class="option-selected-mark" aria-hidden="true"><i data-lucide="check"></i></span>
          </button>
        `).join("")}
      </div>
      ${termsConsent}
    </div>
  `;

  $$(".option-card").forEach((optionButton) => {
    optionButton.addEventListener("click", () => {
      $$(".option-card").forEach((button) => {
        button.classList.remove("selected");
        button.setAttribute("aria-pressed", "false");
      });
      optionButton.classList.add("selected");
      optionButton.setAttribute("aria-pressed", "true");
      state.answers[question.id] = optionButton.dataset.value;
      renderQuestion();
    });
  });

  bindTermsConsent();

  refreshIcons();
}

function renderTermsConsent() {
  return `
    <label class="terms-consent">
      <input id="termsConsentInput" type="checkbox" ${state.acceptedTerms ? "checked" : ""}>
      <span>
        Li e aceito os
        <a href="direitos-termos.html" target="_blank" rel="noopener noreferrer">termos de uso e serviço</a>
        do AprovAI.
      </span>
    </label>
  `;
}

function bindTermsConsent() {
  const input = $("#termsConsentInput");
  if (!input) return;

  input.addEventListener("change", () => {
    state.acceptedTerms = input.checked;
  });
}

function finishOnboarding() {
  elements.questionForm.style.display = "none";
  elements.builder.classList.add("show");
  rotateBuilderMessages();

  setTimeout(() => {
    const profile = buildProfile(state.answers);
    state.profile = profile;
    saveJson(storageKey, profile);
    closeOnboarding();
    renderDashboard();
    showToast("Modelo de aprendizagem criado com sucesso.");
  }, 2300);
}

function rotateBuilderMessages() {
  const messages = [
    "Analisando objetivo, curso desejado e nível de prioridade.",
    "Organizando módulos, tempo diário e trilha de revisão.",
    "Selecionando os primeiros atalhos do portal do aluno.",
    "Salvando seu modelo para usar nas próximas páginas."
  ];

  let index = 0;
  elements.builderText.textContent = messages[index];
  $$(".builder-step").forEach((step, stepIndex) => step.classList.toggle("active", stepIndex === 0));

  const timer = setInterval(() => {
    index += 1;
    if (index >= messages.length) {
      clearInterval(timer);
      return;
    }

    elements.builderText.textContent = messages[index];
    $$(".builder-step").forEach((step, stepIndex) => step.classList.toggle("active", stepIndex <= index));
  }, 540);
}

function buildProfile(answers) {
  const name = answers.name || "Aluno ENEM";
  const labels = getAnswerLabels(answers);
  const areaFocus = getAreaFocus(answers);
  const tasks = getRecommendedTasks(answers);
  const focus = getFocusDistribution(answers);

  return {
    createdAt: new Date().toISOString(),
    termsAccepted: state.acceptedTerms,
    termsAcceptedAt: state.acceptedTerms ? new Date().toISOString() : null,
    answers,
    name,
    labels,
    areaFocus,
    tasks,
    focus,
    summary: createSummary(answers, labels)
  };
}

function getAnswerLabels(answers) {
  return Object.fromEntries(questions.map((question) => {
    if (question.type === "input") {
      return [question.id, answers[question.id] || "Aluno ENEM"];
    }

    const option = question.options.find((item) => item.value === answers[question.id]);
    return [question.id, option ? option.label : ""];
  }));
}

function getAreaFocus(answers) {
  const courseMap = {
    medicina: "Natureza + redação",
    engenharia: "Matemática + natureza",
    direito: "Humanas + redação",
    licenciatura: "Base ampla",
    tecnologia: "Matemática + lógica",
    indeciso: "Trilha equilibrada"
  };

  const areaMap = {
    linguagens: "Linguagens e redação",
    humanas: "Ciências humanas",
    natureza: "Ciências da natureza",
    matematica: "Matemática"
  };

  return areaMap[answers.area] || courseMap[answers.course] || "Trilha geral";
}

function createSummary(answers, labels) {
  const objective = labels.objective || "evoluir no ENEM";
  const course = labels.course || "um curso ainda em definição";
  const time = labels.time || "tempo diário flexível";
  return `${objective}, mirando ${course}, com ${time.toLowerCase()} e foco inicial em ${getAreaFocus(answers).toLowerCase()}.`;
}

function getRecommendedTasks(answers) {
  const priority = getAreaFocus(answers);
  const difficultyTask = {
    tempo: ["Organizar o primeiro bloco de estudo", "Abrir o Plano 30 dias e escolher três horários possíveis."],
    base: ["Reforçar base antes da prática", "Começar pela Biblioteca com uma apostila introdutória."],
    questoes: ["Criar caderno de erros", "Fazer um quiz curto e salvar os erros para revisão."],
    ansiedade: ["Treinar ritmo com questões cronometradas", "Fazer uma sequência de 10 questões com tempo controlado."]
  };
  const objectiveTask = {
    aprovar: ["Subir intensidade da semana", "Fechar cinco dias de rotina e revisar no sexto."],
    nota: ["Medir evolução por área", "Resolver questões e comparar acertos por assunto."],
    rotina: ["Proteger constância", "Começar com metas pequenas e sequência diária."],
    redacao: ["Priorizar o laboratório de redação", "Montar uma tese e um repertório para o próximo tema."]
  };

  return [
    ["Diagnóstico do foco principal", `Começar por ${priority} e registrar a primeira meta da semana.`],
    difficultyTask[answers.difficulty] || ["Resolver a primeira lista", "Usar o quiz para encontrar lacunas de conteúdo."],
    objectiveTask[answers.objective] || ["Entrar na trilha principal", "Seguir pelo módulo recomendado do portal."],
    ["Fechar o ciclo do dia", "Estudar, praticar, corrigir e deixar a próxima tarefa pronta."]
  ].map(([title, detail], index) => ({ id: `task-${index + 1}`, title, detail }));
}

function getFocusDistribution(answers) {
  const base = {
    "Redação": 20,
    "Questões": 20,
    "Teoria": 20,
    "Revisão": 20,
    "Simulado": 20
  };

  if (answers.objective === "redacao" || answers.area === "linguagens") {
    base["Redação"] += 18;
    base["Teoria"] -= 4;
    base["Simulado"] -= 4;
  }

  if (answers.difficulty === "questoes") {
    base["Questões"] += 18;
    base["Teoria"] -= 6;
  }

  if (answers.difficulty === "base") {
    base["Teoria"] += 16;
    base["Simulado"] -= 6;
  }

  if (answers.time === "3h") {
    base["Simulado"] += 12;
    base["Revisão"] += 5;
  }

  if (answers.course === "medicina") {
    base["Questões"] += 7;
    base["Simulado"] += 8;
  }

  const total = Object.values(base).reduce((sum, value) => sum + value, 0);
  return Object.entries(base).map(([label, value]) => ({
    label,
    value: Math.max(8, Math.round((value / total) * 100))
  }));
}

function renderDashboard() {
  const hasProfile = Boolean(state.profile);
  const profile = state.profile || createEmptyDashboardState();
  const answers = profile.answers;
  const planStats = getPlanProgressStats();

  $("#dashboardTitle").textContent = hasProfile ? `Olá, ${profile.name}. Seu portal está pronto.` : "Bem-vindo ao seu centro de estudos";
  $("#dashboardSubtitle").textContent = hasProfile ? profile.summary : "Nenhum dado de estudo registrado ainda. Responda o diagnóstico para criar sua trilha.";
  $("#heroText").textContent = hasProfile ? `Modelo ativo: ${profile.summary}` : "Responda o mini questionário para criarmos um modelo de aprendizagem com metas, prioridades e próximos passos.";
  $("#heroGoal").textContent = profile.labels.course || "Sem curso";
  $("#heroGoalIcon").setAttribute("data-lucide", getCourseIcon(answers.course));
  $("#heroArea").textContent = profile.areaFocus;
  $("#heroPace").textContent = profile.labels.time || "Sem ritmo";
  $("#sidebarFocus").textContent = profile.areaFocus;
  $("#sidebarHint").textContent = hasProfile ? "Suas escolhas já estão salvas para as próximas páginas." : "Complete o mini questionário para liberar seu modelo.";
  $("#sidebarProgress").style.width = hasProfile ? "100%" : "0%";
  $("#streakValue").textContent = `${planStats.streak} ${planStats.streak === 1 ? "dia" : "dias"}`;
  $("#streakLabel").textContent = planStats.lastDate
    ? `${planStats.completedDays}/30 dias no plano. Último estudo: ${formatDate(planStats.lastDate)}.`
    : "Comece pelo Plano 30 dias para iniciar sua sequência.";
  $("#modelValue").textContent = hasProfile ? "Ativo" : "Pendente";
  $("#modelLabel").textContent = hasProfile ? "Personalização salva no navegador." : "Questionário inicial aguardando.";
  $("#priorityValue").textContent = profile.areaFocus;
  $("#priorityLabel").textContent = getPriorityLabel(answers);
  $("#timeValue").textContent = profile.labels.time || "A definir";
  $("#timeLabel").textContent = getShiftLabel(answers);
  $("#studentName").textContent = profile.name;
  $("#avatarInitials").textContent = getInitials(profile.name);
  $("#studentSummary").textContent = hasProfile ? profile.summary : "Seu perfil será montado após o questionário inicial.";
  $("#modulesTitle").textContent = hasProfile ? "Continue por onde faz sentido" : "Módulos disponíveis";
  $("#heroCtaButton").innerHTML = hasProfile
    ? '<i data-lucide="calendar-days"></i> Ver plano'
    : '<i data-lucide="wand-sparkles"></i> Criar meu modelo';

  renderProfileTags(profile, hasProfile);
  renderSettingsPanel();
  renderTasks(profile.tasks, hasProfile);
  renderModules(answers, hasProfile);
  renderWeekBoard();
  renderFocusChart(profile.focus);
  renderActivity(profile, hasProfile);
  refreshIcons();
}

function renderSettingsPanel() {
  const hasProfile = Boolean(state.profile);
  const profile = state.profile || createEmptyDashboardState();
  const completedTasks = Object.values(state.tasks).filter(Boolean).length;

  $("#settingsTrailStatus").textContent = hasProfile
    ? `${profile.areaFocus} criada com ${profile.tasks.length} ações e ${completedTasks} concluídas.`
    : "Nenhuma trilha criada ainda.";

  $$("[data-theme-choice]").forEach((button) => {
    button.classList.toggle("active", button.dataset.themeChoice === state.settings.theme);
  });

  $("#motionToggle").checked = Boolean(state.settings.motion);
  $("#contrastToggle").checked = Boolean(state.settings.contrast);
  $("#reminderToggle").checked = Boolean(state.settings.reminders);
  $("#progressToggle").checked = Boolean(state.settings.showProgress);
  $("#densitySelect").value = state.settings.density;
}

function updateSettings(changes) {
  if (changes.theme === "dark") {
    changes = { ...changes, theme: "light" };
  }

  state.settings = { ...state.settings, ...changes };
  saveJson(settingsKey, state.settings);
  applySettings();
  renderSettingsPanel();
}

function applySettings() {
  if (state.settings.theme === "dark") {
    state.settings.theme = "light";
    saveJson(settingsKey, state.settings);
  }

  document.body.dataset.theme = "light";
  document.body.dataset.motion = state.settings.motion ? "reduced" : "full";
  document.body.dataset.contrast = state.settings.contrast ? "high" : "normal";
  document.body.dataset.density = state.settings.density;
}

function createEmptyDashboardState() {
  return {
    answers: {},
    labels: {},
    name: "Aluno",
    areaFocus: "Sem diagnóstico",
    tasks: [],
    focus: [
      { label: "Redação", value: 0 },
      { label: "Questões", value: 0 },
      { label: "Teoria", value: 0 },
      { label: "Revisão", value: 0 },
      { label: "Simulado", value: 0 }
    ],
    summary: ""
  };
}

function getCourseIcon(course) {
  const icons = {
    medicina: "heart-pulse",
    engenharia: "drafting-compass",
    direito: "scale",
    licenciatura: "graduation-cap",
    tecnologia: "cpu",
    indeciso: "compass"
  };

  return icons[course] || "graduation-cap";
}

function getPriorityLabel(answers) {
  const labels = {
    tempo: "Primeiro passo: agenda simples.",
    base: "Primeiro passo: teoria essencial.",
    questoes: "Primeiro passo: prática corrigida.",
    ansiedade: "Primeiro passo: treino cronometrado."
  };
  return labels[answers.difficulty] || "A plataforma ajusta o caminho.";
}

function getShiftLabel(answers) {
  const labels = {
    manha: "Blocos fortes pela manhã.",
    tarde: "Rotina encaixada à tarde.",
    noite: "Revisões e prática à noite.",
    variavel: "Flexível para sua semana."
  };
  return labels[answers.shift] || "Vamos calibrar a rotina.";
}

function renderProfileTags(profile, hasProfile) {
  const tags = hasProfile
    ? [profile.labels.objective, profile.labels.course, profile.areaFocus, profile.labels.time]
    : [];

  $("#profileTags").innerHTML = tags.filter(Boolean).map((tag) => `<span class="tag">${tag}</span>`).join("");
}

function renderTasks(tasks, hasProfile) {
  if (!hasProfile || !tasks.length) {
    $("#taskList").innerHTML = `
      <article class="empty-state">
        <i data-lucide="clipboard-list"></i>
        <strong>Nenhuma ação recomendada ainda</strong>
        <span>As próximas ações aparecem depois que o aluno responder o mini diagnóstico.</span>
      </article>
    `;
    return;
  }

  $("#taskList").innerHTML = tasks.map((task) => {
    const done = Boolean(state.tasks[task.id]);
    return `
      <article class="task-item ${done ? "done" : ""}" data-task-id="${task.id}">
        <button class="task-check" type="button" aria-label="Marcar tarefa">
          <i data-lucide="${done ? "check" : "circle"}"></i>
        </button>
        <div class="task-copy">
          <strong>${task.title}</strong>
          <span>${task.detail}</span>
        </div>
        <a class="task-action" href="plano-estudos.html">Abrir</a>
      </article>
    `;
  }).join("");

  $$(".task-check").forEach((button) => {
    button.addEventListener("click", () => {
      const task = button.closest(".task-item");
      const taskId = task.dataset.taskId;
      state.tasks[taskId] = !state.tasks[taskId];
      saveJson(taskKey, state.tasks);
      renderDashboard();
      showToast(state.tasks[taskId] ? "Tarefa marcada como concluída." : "Tarefa reaberta.");
    });
  });
}

function renderModules(answers, hasProfile) {
  const boosted = hasProfile ? prioritizeModules(answers) : modules;
  $("#moduleGrid").innerHTML = boosted.map((module) => `
    <a class="module-card" href="${module.href}">
      <div class="module-top">
        <span class="module-icon"><i data-lucide="${module.icon}"></i></span>
        <i data-lucide="arrow-up-right"></i>
      </div>
      <h3>${module.title}</h3>
      <p>${module.description}</p>
      <div class="module-foot" ${state.settings.showProgress ? "" : "hidden"}>
        <div class="module-progress" aria-hidden="true">
          <span style="width: ${module.progress}%"></span>
        </div>
        <small>${module.progress}%</small>
      </div>
    </a>
  `).join("");
}

function prioritizeModules(answers) {
  const priority = {
    redacao: ["redacao", "biblioteca"],
    linguagens: ["redacao", "biblioteca"],
    matematica: ["quiz", "questoes"],
    natureza: ["quiz", "questoes"],
    humanas: ["biblioteca", "questoes"]
  };
  const target = priority[answers.objective] || priority[answers.area] || ["plano"];

  return [...modules].sort((a, b) => {
    const aScore = target.includes(a.id) ? -1 : 0;
    const bScore = target.includes(b.id) ? -1 : 0;
    return aScore - bScore;
  });
}

function renderWeekBoard() {
  const profile = state.profile;
  if (!profile) {
    $("#weekBoard").innerHTML = `
      <article class="empty-state wide">
        <i data-lucide="calendar-days"></i>
        <strong>Nenhuma rotina gerada</strong>
        <span>A rotina semanal depende das respostas reais do questionário.</span>
      </article>
    `;
    return;
  }

  const focus = profile ? profile.areaFocus : "Trilha geral";
  const days = weekModes[state.weekMode].map((day, index) => {
    const isFocusDay = index === 0 || index === 3;
    return {
      name: day[0],
      action: isFocusDay ? `${day[1]}: ${focus}` : day[1],
      time: day[2]
    };
  });

  $("#weekBoard").innerHTML = days.map((day) => `
    <article class="day-card">
      <strong>${day.name}</strong>
      <span>${day.action}</span>
      <small>${day.time}</small>
    </article>
  `).join("");
}

function renderFocusChart(focus) {
  $("#focusChart").innerHTML = focus.map((item) => `
    <div class="focus-row">
      <div class="focus-meta">
        <span>${item.label}</span>
        <strong>${item.value}%</strong>
      </div>
      <div class="focus-bar" aria-hidden="true">
        <span style="width: ${item.value}%"></span>
      </div>
    </div>
  `).join("");
}

function renderActivity(profile, hasProfile) {
  const created = hasProfile ? formatDate(profile.createdAt) : "hoje";
  const items = hasProfile
    ? [
      `Perfil criado em ${created}.`,
      `Foco definido em ${profile.areaFocus}.`,
      `Rotina sugerida para ${profile.labels.time.toLowerCase()}.`,
      "Próxima página recomendada: Plano 30 dias."
    ]
    : [
      "Dashboard iniciado.",
      "Questionário aguardando resposta.",
      "Módulos preparados para conexão.",
      "Modelo será usado nas próximas páginas."
    ];

  $("#activityList").innerHTML = items.map((item) => `
    <li>
      <span><i data-lucide="sparkle"></i></span>
      <p>${item}</p>
    </li>
  `).join("");
}

function shuffleTasks() {
  if (!state.profile) {
    showToast("Crie seu modelo primeiro para reordenar a trilha.");
    return;
  }

  state.profile.tasks = [...state.profile.tasks].sort(() => Math.random() - 0.5);
  saveJson(storageKey, state.profile);
  renderTasks(state.profile.tasks, true);
  refreshIcons();
  showToast("Trilha reordenada.");
}

function editName() {
  if (!state.profile) {
    showToast("Responda o diagnóstico antes de editar o perfil.");
    openOnboarding();
    return;
  }

  const currentName = state.profile ? state.profile.name : "Aluno ENEM";
  const newName = window.prompt("Qual nome deve aparecer no portal?", currentName);

  if (!newName || !newName.trim()) {
    return;
  }

  state.profile.name = newName.trim().slice(0, 28);
  state.profile.answers.name = state.profile.name;
  state.profile.labels.name = state.profile.name;
  saveJson(storageKey, state.profile);
  renderDashboard();
  showToast("Nome atualizado.");
}

function resetProfile() {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(taskKey);
  state.profile = null;
  state.tasks = {};
  renderDashboard();
  openOnboarding();
  showToast("Perfil reiniciado.");
}

function clearTasks() {
  localStorage.removeItem(taskKey);
  state.tasks = {};
  renderDashboard();
  showToast("Tarefas limpas.");
}

function clearAllData() {
  const confirmed = window.confirm("Apagar perfil, tarefas e configurações deste navegador?");

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(storageKey);
  localStorage.removeItem(taskKey);
  localStorage.removeItem(settingsKey);
  state.profile = null;
  state.tasks = {};
  state.settings = { ...defaultSettings };
  applySettings();
  renderDashboard();
  closeSettings();
  openOnboarding();
  showToast("Dados apagados. Vamos recomeçar.");
}

function exportProfile() {
  const payload = {
    profile: state.profile,
    tasks: state.tasks,
    settings: state.settings,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "saas-enem-dados.json";
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("Dados exportados.");
}

function showToast(message) {
  elements.toastText.textContent = message;
  elements.toast.classList.add("show");
  refreshIcons();
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2600);
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
  $("#syncStatus").innerHTML = '<i data-lucide="cloud-check"></i> Preferências salvas';
}

function formatDate(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = String(value).split("-");
    return `${day}/${month}/${year}`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function getPlanProgressStats() {
  const progress = readJson(planProgressKey) || {};
  const studyDates = [...new Set(progress.studyDates || [])].sort();
  const completedDays = Object.values(progress.days || {}).filter(Boolean).length;
  const streak = calculatePlanStreak(studyDates);
  return {
    completedDays,
    streak: streak.current,
    lastDate: streak.lastDate
  };
}

function calculatePlanStreak(studyDates) {
  if (!studyDates.length) return { current: 0, lastDate: null };
  const dateSet = new Set(studyDates);
  const today = new Date();
  let cursor = dateSet.has(toDateKey(today)) ? today : addDays(today, -1);
  let current = 0;

  while (dateSet.has(toDateKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    current,
    lastDate: studyDates[studyDates.length - 1]
  };
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AL";
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

document.addEventListener("DOMContentLoaded", init);
