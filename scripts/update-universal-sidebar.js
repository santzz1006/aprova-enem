const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const pages = [
  {
    file: "biblioteca.html",
    active: "biblioteca",
    summary: `
        <div class="sidebar-summary">
          <span class="summary-label">Biblioteca ativa</span>
          <strong id="sidebarArea">Todas as áreas</strong>
          <div class="mini-progress" aria-hidden="true">
            <span id="sidebarProgress"></span>
          </div>
          <small id="sidebarProgressText">Nenhuma apostila concluída ainda.</small>
        </div>`
  },
  {
    file: "quiz.html",
    active: "quiz",
    summary: `
        <div class="sidebar-summary">
          <span class="summary-label">Área inicial</span>
          <strong id="sidebarArea">Todas as áreas</strong>
          <div class="mini-progress" aria-hidden="true">
            <span id="sidebarAccuracy"></span>
          </div>
          <small id="sidebarProgressText">Nenhuma questão respondida ainda.</small>
        </div>`
  },
  {
    file: "questoes.html",
    active: "questoes",
    summary: `
        <div class="sidebar-summary">
          <span class="summary-label">Simulado atual</span>
          <strong id="sidebarModule">Módulo 1</strong>
          <div class="mini-progress" aria-hidden="true">
            <span id="sidebarProgress"></span>
          </div>
          <small id="sidebarProgressText">Nenhuma questão respondida ainda.</small>
        </div>`
  },
  {
    file: "temas-frequentes.html",
    active: "questoes",
    summary: `
        <div class="sidebar-summary">
          <span class="summary-label">Mapa ENEM</span>
          <strong id="sidebarCount">Carregando</strong>
          <div class="mini-progress" aria-hidden="true">
            <span style="width: 100%"></span>
          </div>
          <small>Assuntos recorrentes, padrões e estratégias.</small>
        </div>`
  },
  {
    file: "redacao.html",
    active: "redacao",
    summary: `
        <div class="sidebar-summary">
          <span class="summary-label">Correção ativa</span>
          <strong id="sidebarScore">0/1000</strong>
          <div class="mini-progress" aria-hidden="true">
            <span id="sidebarProgress"></span>
          </div>
          <small>Escreva, envie ou cole uma redação para receber estimativa por competência.</small>
        </div>`
  },
  {
    file: "redacao-editor.html",
    active: "redacao",
    summary: `
        <div class="sidebar-summary">
          <span class="summary-label">Nota ao vivo</span>
          <strong id="sidebarScore">0/1000</strong>
          <div class="mini-progress" aria-hidden="true">
            <span id="sidebarProgress"></span>
          </div>
          <small id="liveStatus">Aguardando texto.</small>
        </div>`
  },
  {
    file: "redacao-modelos.html",
    active: "redacao",
    summary: `
        <div class="sidebar-summary">
          <span class="summary-label">Modelos</span>
          <strong id="modelCount">10 redações</strong>
          <div class="mini-progress" aria-hidden="true">
            <span style="width: 100%"></span>
          </div>
          <small>Use como referência estrutural e adapte ao tema.</small>
        </div>`
  }
];

const links = [
  ["dashboard", "dashboard.html", "layout-dashboard", "Dashboard"],
  ["biblioteca", "biblioteca.html", "library", "Biblioteca"],
  ["quiz", "quiz.html", "messages-square", "Quiz por matéria"],
  ["questoes", "questoes.html", "badge-help", "Questões ENEM"],
  ["redacao", "redacao.html", "pen-tool", "Redação"],
  ["plano", "plano-estudos.html", "calendar-check", "Plano 30 dias"]
];

function universalSidebar(active, summary) {
  const nav = links.map(([id, href, icon, label]) => {
    const isActive = id === active;
    return `          <a class="nav-link${isActive ? " active" : ""}" href="${href}"${isActive ? ' aria-current="page"' : ""}>
            <i data-lucide="${icon}"></i>
            <span>${label}</span>
          </a>`;
  }).join("\n");

  return `    <aside class="sidebar" aria-label="Navegação principal">
      <div class="sidebar-flow">
        <a class="brand" href="dashboard.html" aria-label="SaaS ENEM 2026">
          <span class="brand-mark">SE</span>
          <span>
            <strong>SaaS ENEM</strong>
            <small>Portal 2026</small>
          </span>
        </a>

        <nav class="main-nav">
${nav}
          <a class="nav-link nav-button" href="dashboard.html">
            <i data-lucide="settings"></i>
            <span>Configurações</span>
          </a>
        </nav>
${summary}
      </div>
    </aside>
`;
}

for (const page of pages) {
  const filePath = path.join(root, page.file);
  const html = fs.readFileSync(filePath, "utf8");
  const updated = html.replace(
    /    <aside class="sidebar" aria-label="Navega(?:ç|Ã§)(?:ão|Ã£o) principal">[\s\S]*?    <\/aside>\r?\n/,
    universalSidebar(page.active, page.summary)
  );

  if (updated === html) {
    throw new Error(`Sidebar not replaced in ${page.file}`);
  }

  fs.writeFileSync(filePath, updated, "utf8");
  console.log(`Updated ${page.file}`);
}
