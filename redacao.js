const rulesFile = "data/redacao/regras-redacao.json?v=redacao-lab-1";
const modelsFile = "data/redacao/modelos-redacao.json?v=redacao-lab-1";
const draftKey = "saasEnemRedacaoDraftV1";
const selectedModelKey = "saasEnemSelectedModelV1";

const state = {
  rules: null,
  models: [],
  modelFilter: "all",
  modelQuery: ""
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadRules();
  await loadModels(false);
  const page = document.body.dataset.page;
  if (page === "lab") initLab();
  if (page === "editor") initEditor();
  if (page === "modelos") await initModels();
  refreshIcons();
}

async function loadRules() {
  try {
    const response = await fetch(rulesFile);
    if (!response.ok) throw new Error("Regras não carregadas.");
    state.rules = await response.json();
  } catch (error) {
    state.rules = fallbackRules();
    showToast("Regras locais não carregaram. Usei análise básica.");
  }
}

function initLab() {
  renderEmptyScore("#previewBars");
  bindFileUpload();
  $("#evaluateLabButton").addEventListener("click", evaluateLabText);
  $("#clearLabButton").addEventListener("click", () => {
    $("#labEssayText").value = "";
    $("#fileFeedback").textContent = "Nenhum arquivo selecionado.";
    renderEvaluation(analyzeEssay("", ""), "lab");
  });
  $("#labEssayText").addEventListener("input", debounce(evaluateLabText, 260));
  renderEvaluation(analyzeEssay("", ""), "lab");
}

function initEditor() {
  const editor = $("#essayEditor");
  const theme = $("#essayTheme");
  const selectedModel = readJson(selectedModelKey);
  const savedDraft = readJson(draftKey);

  if (selectedModel) {
    theme.value = selectedModel.theme || "";
    editor.value = selectedModel.essay || "";
    localStorage.removeItem(selectedModelKey);
  } else if (savedDraft) {
    theme.value = savedDraft.theme || "";
    editor.value = savedDraft.text || "";
  }

  editor.addEventListener("input", debounce(evaluateEditor, 180));
  theme.addEventListener("input", debounce(evaluateEditor, 180));
  $("#saveDraftButton").addEventListener("click", saveDraft);
  $("#clearEditorButton").addEventListener("click", () => {
    editor.value = "";
    theme.value = "";
    localStorage.removeItem(draftKey);
    evaluateEditor();
    showToast("Editor limpo.");
  });
  $("#themeSuggestionButton").addEventListener("click", suggestTheme);
  evaluateEditor();
}

async function initModels() {
  await loadModels();
  $("#modelSearch").addEventListener("input", (event) => {
    state.modelQuery = event.target.value.trim().toLowerCase();
    renderModels();
  });
  $$("[data-model-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.modelFilter = button.dataset.modelFilter;
      $$("[data-model-filter]").forEach((item) => item.classList.toggle("active", item === button));
      renderModels();
    });
  });
  renderModels();
}

async function loadModels(updateCount = true) {
  if (state.models.length) {
    if (updateCount && $("#modelCount")) $("#modelCount").textContent = `${state.models.length} redações`;
    return;
  }

  try {
    const response = await fetch(modelsFile);
    if (!response.ok) throw new Error("Modelos não carregados.");
    const data = await response.json();
    state.models = data.models || [];
    if (updateCount && $("#modelCount")) $("#modelCount").textContent = `${state.models.length} redações`;
  } catch (error) {
    state.models = [];
    if (updateCount) showToast("Não foi possível carregar os modelos.");
  }
}

function bindFileUpload() {
  const input = $("#essayFile");
  const zone = $("#dropZone");
  input.addEventListener("change", () => handleFile(input.files[0]));
  ["dragenter", "dragover"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.remove("dragging");
    });
  });
  zone.addEventListener("drop", (event) => handleFile(event.dataTransfer.files[0]));
}

function handleFile(file) {
  if (!file) return;
  $("#fileFeedback").textContent = `${file.name} selecionado.`;
  const readable = /\.(txt|md)$/i.test(file.name);
  if (!readable) {
    $("#fileFeedback").textContent = `${file.name} selecionado. PDF/imagem ficam prontos para OCR futuro; cole o texto para avaliar agora.`;
    showToast("Arquivo recebido. Cole o texto para análise nesta versão.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    $("#labEssayText").value = String(reader.result || "");
    evaluateLabText();
    showToast("Texto carregado do arquivo.");
  };
  reader.readAsText(file);
}

function evaluateLabText() {
  const text = $("#labEssayText").value;
  const result = analyzeEssay(text, "");
  renderEvaluation(result, "lab");
  renderPreview(result);
}

function evaluateEditor() {
  const text = $("#essayEditor").value;
  const theme = $("#essayTheme").value;
  const result = analyzeEssay(text, theme);
  renderEvaluation(result, "live");
  renderTextStats(text, result);
  renderStructure(result);
  $("#liveStatus").textContent = text.trim() ? "Análise atualizada enquanto você escreve." : "Aguardando texto.";
}

function analyzeEssay(text, theme) {
  const clean = text.trim();
  const words = countWords(clean);
  const paragraphs = clean ? clean.split(/\n{2,}|\r\n{2,}/).map((item) => item.trim()).filter(Boolean) : [];
  const sentences = clean ? clean.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean) : [];
  if (!clean) return emptyResult();
  const lower = normalize(clean);
  const modelMatch = findKnownModelMatch(clean);
  if (modelMatch) return perfectModelResult(modelMatch, clean, theme);
  const themeWords = normalize(theme).split(/\s+/).filter((word) => word.length > 4);
  const relevance = assessThemeRelevance(theme, lower, words);
  const themeMatches = relevance.directMatches;
  const connectors = state.rules.competencies.find((item) => item.id === "c4").connectors;
  const usedConnectors = connectors.filter((item) => lower.includes(normalize(item)));
  const repertoire = state.rules.competencies.find((item) => item.id === "c2").repertoireMarkers;
  const usedRepertoire = repertoire.filter((item) => lower.includes(normalize(item)));
  const c5Rules = state.rules.competencies.find((item) => item.id === "c5");
  const intervention = detectIntervention(lower, c5Rules);
  const informalCount = countMatches(lower, state.rules.competencies.find((item) => item.id === "c1").rules.informalTerms.map(normalize));
  const longSentences = sentences.filter((sentence) => countWords(sentence) > 38).length;
  const commonErrors = detectCommonErrors(clean);
  const repeatedWords = detectRepeatedWords(clean);

  let c1 = clamp(100 + Math.min(words, 200) * 0.38 - informalCount * 8 - longSentences * 7 - commonErrors.length * 10 - repeatedWords.length * 2, 0, 200);
  let c2 = clamp(72 + Math.min(themeMatches, 5) * 18 + relevance.semanticMatches * 12 + usedRepertoire.length * 16 + (paragraphs.length >= 4 ? 42 : paragraphs.length * 9) + (hasThesis(lower) ? 34 : 0), 0, 200);
  let c3 = clamp(76 + countMatches(lower, ["causa", "consequencia", "problema", "fator", "impacto", "desigualdade"]) * 11 + (paragraphs.length >= 3 ? 42 : paragraphs.length * 8) + (usedRepertoire.length ? 24 : 0), 0, 200);
  let c4 = clamp(82 + usedConnectors.length * 12 + (paragraphs.length >= 4 ? 34 : paragraphs.length * 7) - repeatedWords.length * 2, 0, 200);
  let c5 = clamp(45 + intervention.score, 0, 200);

  if (relevance.level === "fuga") {
    c2 = Math.min(c2, 20);
    c3 = Math.min(c3, 55);
    c5 = Math.min(c5, 70);
  }

  if (relevance.level === "tangente") {
    c2 = Math.min(c2, 85);
    c3 = Math.min(c3, 120);
    c5 = Math.min(c5, 140);
  }

  const rawTotal = Math.round(c1 + c2 + c3 + c4 + c5);
  const total = relevance.scoreCap ? Math.min(rawTotal, relevance.scoreCap) : rawTotal;

  const competencies = [
    buildCompetence("c1", c1, commonErrors.concat(informalCount ? [`Reduza marcas informais detectadas: ${informalCount}.`] : []).concat(longSentences ? ["Há frases longas demais; divida para ganhar clareza."] : [])),
    buildCompetence("c2", c2, relevance.notes.concat(usedRepertoire.length ? [`Repertório detectado: ${usedRepertoire.slice(0, 3).join(", ")}.`] : ["Inclua repertório sociocultural produtivo e explique sua relação com o tema."])),
    buildCompetence("c3", c3, relevance.level === "fuga" ? ["A argumentação está organizada, mas defende outro tema. Isso derruba a nota."] : ["Explique causa, consequência e impacto dos dois argumentos principais."]),
    buildCompetence("c4", c4, usedConnectors.length ? [`Conectivos usados: ${usedConnectors.slice(0, 5).join(", ")}.`] : ["Use conectivos variados para ligar ideias."]),
    buildCompetence("c5", c5, intervention.tips)
  ];

  const tips = buildTips({ words, paragraphs, usedRepertoire, usedConnectors, intervention, commonErrors, total, themeMatches, themeWords, relevance });

  return {
    total,
    words,
    paragraphs,
    sentences,
    competencies,
    tips,
    structure: {
      introduction: paragraphs.length >= 1 && hasThesis(lower),
      development1: paragraphs.length >= 2,
      development2: paragraphs.length >= 3,
      conclusion: paragraphs.length >= 4 && intervention.score >= 110,
      interventionComplete: intervention.score >= 160
    },
    summary: relevance.summary || getSummary(total, words)
  };
}

function buildCompetence(id, score, notes) {
  const meta = state.rules.competencies.find((item) => item.id === id);
  return {
    id,
    name: meta.name,
    label: meta.label,
    score: Math.round(score),
    notes: notes.filter(Boolean)
  };
}

function findKnownModelMatch(text) {
  const simplified = simplifyEssay(text);
  if (!simplified || !state.models.length) return null;

  return state.models.find((model) => {
    const modelText = Array.isArray(model.essay) ? model.essay.join("\n\n") : "";
    return simplifyEssay(modelText) === simplified;
  });
}

function perfectModelResult(model, text, theme) {
  const paragraphs = text.trim().split(/\n{2,}|\r\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const sentences = text.trim().split(/[.!?]+/).map((item) => item.trim()).filter(Boolean);
  const competencies = state.rules.competencies.map((item) => ({
    id: item.id,
    name: item.name,
    label: item.label,
    score: 200,
    notes: [`Modelo "${model.title}" reconhecido no banco oficial do portal.`]
  }));

  return {
    total: 1000,
    words: countWords(text),
    paragraphs,
    sentences,
    competencies,
    tips: [
      "Modelo nota 1000 reconhecido. Use como referência de estrutura, repertório e intervenção.",
      "Ao adaptar, troque o tema, mantenha tese clara e confira se a proposta de intervenção responde ao recorte."
    ],
    structure: {
      introduction: true,
      development1: true,
      development2: true,
      conclusion: true,
      interventionComplete: true
    },
    summary: `Modelo nota 1000 reconhecido: ${model.title}.`
  };
}

function simplifyEssay(text) {
  return normalize(text)
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function assessThemeRelevance(theme, lowerEssay, words) {
  const cleanTheme = normalize(theme);
  if (!cleanTheme) {
    return {
      level: "sem-tema",
      directMatches: 0,
      semanticMatches: 0,
      scoreCap: null,
      notes: ["Digite o tema para a correção avaliar fuga ou tangenciamento."],
      summary: ""
    };
  }

  const themeTokens = extractThemeTokens(cleanTheme);
  const semanticTerms = getSemanticTermsForTheme(cleanTheme);
  const directMatches = themeTokens.filter((token) => lowerEssay.includes(token)).length;
  const semanticMatches = semanticTerms.filter((term) => lowerEssay.includes(term)).length;
  const directRatio = themeTokens.length ? directMatches / themeTokens.length : 0;
  const hasThemePhrase = cleanTheme.length > 8 && lowerEssay.includes(cleanTheme);
  const hasAnyConnection = hasThemePhrase || directMatches > 0 || semanticMatches > 0;

  if (words < 80) {
    return {
      level: hasAnyConnection ? "em-construcao" : "curto",
      directMatches,
      semanticMatches,
      scoreCap: null,
      notes: hasAnyConnection
        ? ["O tema começou a aparecer, mas ainda precisa ser desenvolvido."]
        : ["Retome palavras centrais do tema logo na introdução."],
      summary: ""
    };
  }

  if (!hasAnyConnection) {
    return {
      level: "fuga",
      directMatches,
      semanticMatches,
      scoreCap: 280,
      notes: [
        "Fuga ao tema detectada: o texto não retoma palavras nem ideias centrais do tema proposto.",
        "Mesmo com boa estrutura, redação fora do tema deve receber nota muito baixa."
      ],
      summary: "Fuga ao tema detectada. A nota foi limitada porque o texto não responde ao tema proposto."
    };
  }

  if (directRatio < 0.35 && semanticMatches < 2) {
    return {
      level: "tangente",
      directMatches,
      semanticMatches,
      scoreCap: 520,
      notes: [
        "Tangenciamento do tema: o texto encosta no assunto, mas não desenvolve o recorte pedido.",
        "Retome o tema de forma explícita na tese, nos argumentos e na intervenção."
      ],
      summary: "Tangenciamento do tema. A estrutura existe, mas o texto ainda não desenvolve bem o recorte proposto."
    };
  }

  return {
    level: "alinhado",
    directMatches,
    semanticMatches,
    scoreCap: null,
    notes: ["Tema retomado de forma suficiente para seguir avaliando as competências."],
    summary: ""
  };
}

function extractThemeTokens(cleanTheme) {
  const stopwords = new Set([
    "para", "como", "com", "dos", "das", "nas", "nos", "uma", "uns", "das", "que", "por",
    "sobre", "brasil", "brasileira", "brasileiro", "caminhos", "desafios", "impactos", "sociedade",
    "atual", "contemporanea", "contemporaneo", "necessidade", "importancia"
  ]);

  return cleanTheme
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter((word) => word.length > 3 && !stopwords.has(word));
}

function getSemanticTermsForTheme(cleanTheme) {
  const groups = [
    {
      keys: ["mulher", "violencia", "genero", "feminicidio"],
      terms: ["mulher", "mulheres", "violencia", "genero", "feminicidio", "domestica", "machismo", "patriarcado", "maria da penha", "agressao", "agressor", "vitima", "misoginia", "delegacia"]
    },
    {
      keys: ["desinformacao", "fake", "noticia"],
      terms: ["desinformacao", "fake news", "noticias falsas", "boatos", "checagem", "midia", "algoritmo", "plataformas", "internet", "redes sociais", "informacao"]
    },
    {
      keys: ["educacao", "escola", "ensino"],
      terms: ["educacao", "escola", "ensino", "aprendizagem", "estudantes", "professores", "evasao", "alfabetizacao", "sala de aula", "mec"]
    },
    {
      keys: ["saude", "mental", "jovens"],
      terms: ["saude", "mental", "ansiedade", "depressao", "jovens", "adolescentes", "psicologico", "bem-estar", "sus", "oms"]
    },
    {
      keys: ["racismo", "negra", "negro"],
      terms: ["racismo", "racial", "negros", "negras", "populacao negra", "discriminacao", "preconceito", "igualdade racial", "injuria racial"]
    },
    {
      keys: ["indigena", "afro", "cultura"],
      terms: ["indigena", "indigenas", "afro-brasileira", "cultura", "ancestralidade", "identidade", "memoria", "patrimonio", "povos tradicionais"]
    },
    {
      keys: ["ambiental", "meio", "ambiente", "sustentabilidade"],
      terms: ["ambiente", "ambiental", "sustentabilidade", "desmatamento", "queimadas", "clima", "poluicao", "biodiversidade", "recursos naturais"]
    },
    {
      keys: ["tecnologia", "digital", "internet"],
      terms: ["tecnologia", "digital", "internet", "redes", "algoritmo", "dados", "inovacao", "exclusao digital", "plataformas"]
    }
  ];

  return [...new Set(groups
    .filter((group) => group.keys.some((key) => cleanTheme.includes(key)))
    .flatMap((group) => group.terms.map(normalize)))];
}

function emptyResult() {
  const competencies = state.rules.competencies.map((item) => ({
    id: item.id,
    name: item.name,
    label: item.label,
    score: 0,
    notes: ["Aguardando texto para análise."]
  }));

  return {
    total: 0,
    words: 0,
    paragraphs: [],
    sentences: [],
    competencies,
    tips: ["Escreva ou cole uma redação para receber orientações em tempo real."],
    structure: {
      introduction: false,
      development1: false,
      development2: false,
      conclusion: false,
      interventionComplete: false
    },
    summary: "Cole ou escreva uma redação para começar."
  };
}

function detectIntervention(lower, rules) {
  const foundAgents = rules.agentExamples.filter((item) => lower.includes(normalize(item)));
  const hasAction = rules.actionMarkers.some((item) => lower.includes(normalize(item)));
  const hasMeans = rules.meansMarkers.some((item) => lower.includes(normalize(item)));
  const hasPurpose = rules.purposeMarkers.some((item) => lower.includes(normalize(item)));
  const hasDetail = rules.detailMarkers.some((item) => lower.includes(normalize(item)));
  const rightsRisk = rules.humanRightsRisks.some((item) => lower.includes(normalize(item)));
  const score = (foundAgents.length ? 42 : 0) + (hasAction ? 42 : 0) + (hasMeans ? 38 : 0) + (hasPurpose ? 38 : 0) + (hasDetail ? 40 : 0) - (rightsRisk ? 80 : 0);
  const tips = [];
  if (!foundAgents.length) tips.push("Na intervenção, diga quem fará a ação: governo, ministério, escola, mídia, ONGs ou família.");
  if (!hasAction) tips.push("Inclua uma ação concreta: criar, ampliar, fiscalizar, promover, investir ou implementar.");
  if (!hasMeans) tips.push("Explique o meio: por meio de campanhas, projetos, parcerias, leis, fiscalização ou formação.");
  if (!hasPurpose) tips.push("Mostre a finalidade com expressões como 'a fim de' ou 'com o objetivo de'.");
  if (!hasDetail) tips.push("Adicione detalhamento: público-alvo, frequência, exemplo ou parceria.");
  if (rightsRisk) tips.push("A proposta não pode violar direitos humanos.");
  if (!tips.length) tips.push("Intervenção completa detectada.");
  return { score, tips };
}

function detectCommonErrors(text) {
  const rules = state.rules.competencies.find((item) => item.id === "c1").rules.commonErrors;
  return rules.filter((item) => new RegExp(item.pattern, "i").test(text)).map((item) => item.message);
}

function detectRepeatedWords(text) {
  const words = normalize(text).split(/\s+/).filter((word) => word.length > 4);
  const counts = words.reduce((acc, word) => ({ ...acc, [word]: (acc[word] || 0) + 1 }), {});
  return Object.entries(counts).filter(([, count]) => count >= 8).map(([word]) => word).slice(0, 5);
}

function buildTips(data) {
  const tips = [];
  if (data.relevance?.level === "fuga") {
    tips.push("Fuga ao tema: reescreva a tese para responder diretamente ao tema proposto.");
    tips.push("O texto pode ter boa forma, mas precisa falar do problema central pedido na frase-tema.");
  }
  if (data.relevance?.level === "tangente") {
    tips.push("Tangenciamento: aproxime os argumentos do recorte exato do tema, não apenas de um assunto parecido.");
  }
  if (data.words < 120) tips.push("A redação ainda está curta. Tente desenvolver entre 4 parágrafos completos.");
  if (data.paragraphs.length < 4) tips.push("Use a estrutura ENEM: introdução, dois desenvolvimentos e conclusão.");
  if (!data.usedRepertoire.length) tips.push("Adicione repertório sociocultural e explique por que ele ajuda seu argumento.");
  if (data.usedConnectors.length < 4) tips.push("Varie conectivos para melhorar coesão entre frases e parágrafos.");
  if (data.themeWords.length && data.themeMatches < Math.min(3, data.themeWords.length)) tips.push("Retome mais palavras do tema para evitar fuga ou tangenciamento.");
  tips.push(...data.intervention.tips);
  if (data.commonErrors.length) tips.push(...data.commonErrors);
  if (data.total >= 880) tips.unshift("Seu texto já está com cara de redação forte. Agora lapide precisão e repertório.");
  return [...new Set(tips)].slice(0, 8);
}

function renderEvaluation(result, prefix) {
  const scoreEl = $(`#${prefix}Score`);
  const summaryEl = $(`#${prefix}Summary`);
  const compEl = $(`#${prefix}Competencies`);
  const tipsEl = $(`#${prefix}Tips`);
  if (!scoreEl) return;
  scoreEl.textContent = result.total;
  summaryEl.textContent = result.summary;
  compEl.innerHTML = result.competencies.map(renderCompetence).join("");
  tipsEl.innerHTML = result.tips.map((tip, index) => `<article class="tip-card ${index === 0 && result.total >= 780 ? "good" : ""}">${tip}</article>`).join("");
  updateSidebar(result);
  refreshIcons();
}

function renderPreview(result) {
  $("#previewScore").textContent = result.total;
  renderBars("#previewBars", result.competencies);
}

function renderEmptyScore(selector) {
  renderBars(selector, state.rules.competencies.map((item) => ({ name: item.name, label: item.label, score: 0 })));
}

function renderBars(selector, competencies) {
  const target = $(selector);
  if (!target) return;
  target.innerHTML = competencies.map(renderCompetence).join("");
}

function renderCompetence(item) {
  const percent = Math.round((item.score / 200) * 100);
  return `
    <section class="competence-item">
      <div class="competence-head"><span>${item.name} · ${item.label}</span><strong>${item.score}/200</strong></div>
      <div class="bar-track" aria-hidden="true"><span style="width:${percent}%"></span></div>
      ${(item.notes || []).slice(0, 1).map((note) => `<small>${note}</small>`).join("")}
    </section>
  `;
}

function renderTextStats(text, result) {
  $("#textStats").innerHTML = `
    <span>${result.words} palavras</span>
    <span>${result.paragraphs.length} parágrafos</span>
    <span>${result.sentences.length} frases</span>
  `;
}

function renderStructure(result) {
  const checks = [
    ["Introdução com tese", result.structure.introduction],
    ["Desenvolvimento 1", result.structure.development1],
    ["Desenvolvimento 2", result.structure.development2],
    ["Conclusão com intervenção", result.structure.conclusion],
    ["Intervenção completa", result.structure.interventionComplete]
  ];
  $("#structureChecklist").innerHTML = checks.map(([label, done]) => `
    <div class="check-item ${done ? "done" : ""}">
      <i data-lucide="${done ? "check-circle-2" : "circle"}"></i>
      <span>${label}</span>
    </div>
  `).join("");
}

function renderModels() {
  const models = state.models.filter((model) => {
    if (state.modelFilter !== "all" && model.type !== state.modelFilter) return false;
    if (!state.modelQuery) return true;
    const haystack = [model.title, model.theme, model.type, ...(model.tags || []), ...(model.essay || [])].join(" ").toLowerCase();
    return haystack.includes(state.modelQuery);
  });
  $("#modelsList").innerHTML = models.map(renderModelCard).join("") || `<div class="panel">Nenhum modelo encontrado.</div>`;
  $$("[data-use-model]").forEach((button) => {
    button.addEventListener("click", () => {
      const model = state.models.find((item) => item.id === button.dataset.useModel);
      localStorage.setItem(selectedModelKey, JSON.stringify({ theme: model.theme, essay: model.essay.join("\n\n") }));
      showToast("Modelo enviado para o editor.");
      setTimeout(() => { window.location.href = "redacao-editor.html"; }, 450);
    });
  });
  refreshIcons();
}

function renderModelCard(model) {
  return `
    <article class="model-card">
      <header>
        <div>
          <span class="eyebrow">${model.type === "adaptavel" ? "Modelo adaptável" : "Tema específico"}</span>
          <h2>${model.title}</h2>
          <p>${model.theme}</p>
        </div>
        <span class="status-pill">${model.scoreTarget}</span>
      </header>
      ${model.slots ? `<div class="tag-row">${model.slots.map((slot) => `<span class="slot">[${slot}]</span>`).join("")}</div>` : ""}
      <div class="model-text">${model.essay.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div>
      <div class="tag-row">${model.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="model-actions">
        <button class="primary-button" type="button" data-use-model="${model.id}"><i data-lucide="send"></i> Usar no editor</button>
      </div>
    </article>
  `;
}

function saveDraft() {
  localStorage.setItem(draftKey, JSON.stringify({
    theme: $("#essayTheme").value,
    text: $("#essayEditor").value,
    savedAt: new Date().toISOString()
  }));
  showToast("Rascunho salvo.");
}

function suggestTheme() {
  const themes = state.rules.themes || [];
  $("#essayTheme").value = themes[Math.floor(Math.random() * themes.length)] || "";
  evaluateEditor();
}

function updateSidebar(result) {
  const score = $("#sidebarScore");
  const progress = $("#sidebarProgress");
  if (score) score.textContent = `${result.total}/1000`;
  if (progress) progress.style.width = `${Math.min(100, Math.round(result.total / 10))}%`;
}

function getSummary(total, words) {
  if (!words) return "Cole ou escreva uma redação para começar.";
  if (total >= 880) return state.rules.feedbackMessages.excellent;
  if (total >= 720) return state.rules.feedbackMessages.good;
  if (total >= 520) return state.rules.feedbackMessages.medium;
  return state.rules.feedbackMessages.low;
}

function hasThesis(lower) {
  return ["nesse sentido", "desse modo", "portanto", "assim", "o problema", "tal cenário", "essa realidade", "defende-se"].some((item) => lower.includes(normalize(item)));
}

function countWords(text) {
  return (text.match(/\b[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)?\b/gu) || []).length;
}

function countMatches(text, items) {
  return items.reduce((sum, item) => sum + (text.includes(normalize(item)) ? 1 : 0), 0);
}

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function debounce(callback, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    return null;
  }
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  $("#toastText").textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function fallbackRules() {
  return {
    competencies: [
      { id: "c1", name: "Competencia 1", label: "Norma-padrao", rules: { informalTerms: [], commonErrors: [] } },
      { id: "c2", name: "Competencia 2", label: "Tema", repertoireMarkers: [] },
      { id: "c3", name: "Competencia 3", label: "Argumentacao" },
      { id: "c4", name: "Competencia 4", label: "Coesao", connectors: [] },
      { id: "c5", name: "Competencia 5", label: "Intervencao", agentExamples: [], actionMarkers: [], meansMarkers: [], purposeMarkers: [], detailMarkers: [], humanRightsRisks: [] }
    ],
    themes: [],
    feedbackMessages: { excellent: "Ótimo texto.", good: "Boa base.", medium: "Precisa desenvolver.", low: "Texto incompleto." }
  };
}
