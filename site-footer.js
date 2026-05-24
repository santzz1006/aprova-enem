(function initSiteFooter() {
  const existingFooter = document.querySelector(".site-footer");
  if (existingFooter) return;

  const main =
    document.querySelector("main") ||
    document.querySelector(".dashboard") ||
    document.querySelector(".redacao-main") ||
    document.body;

  const year = new Date().getFullYear();

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.setAttribute("aria-label", "Rodape do AprovAI");
  footer.innerHTML = `
    <div class="site-footer-inner">
      <div class="footer-brand">
        <a class="footer-logo" href="dashboard.html" aria-label="Voltar ao painel AprovAI">
          <img src="aprovai.croco.png" alt="AprovAI">
        </a>
        <p>Um ambiente de estudo ENEM com trilha, biblioteca, quiz, questoes, redacao e rotina organizada em um so lugar.</p>
        <div class="footer-rights-note">
          <i data-lucide="shield-check"></i>
          <span>Conteudo e site com direitos reservados ao criador <strong>kzincks</strong>.</span>
        </div>
      </div>

      <nav class="footer-column" aria-label="Areas do site">
        <h2>Areas do site</h2>
        <a href="dashboard.html">Dashboard</a>
        <a href="biblioteca.html">Biblioteca</a>
        <a href="quiz.html">Quiz por materia</a>
        <a href="questoes.html">Questoes ENEM</a>
        <a href="redacao.html">Redacao</a>
        <a href="plano-estudos.html">Plano 30 dias</a>
      </nav>

      <nav class="footer-column" aria-label="Estudo e pratica">
        <h2>Estudo e pratica</h2>
        <a href="temas-frequentes.html">Temas frequentes</a>
        <a href="ambiente-estudo.html">Ambiente de estudo</a>
        <a href="redacao-editor.html">Editor de redacao</a>
        <a href="redacao-modelos.html">Modelos de redacao</a>
        <a href="questoes.html">Mapa de questoes</a>
        <a href="dashboard.html">Metas e progresso</a>
      </nav>

      <nav class="footer-column" aria-label="Ideias de aprendizagem">
        <h2>Ideias</h2>
        <a href="dashboard.html">Diagnostico inicial</a>
        <a href="plano-estudos.html">Rotina inteligente</a>
        <a href="biblioteca.html">Apostilas por area</a>
        <a href="quiz.html">Revisao por erros</a>
        <a href="redacao.html">Checklist de competencias</a>
        <a href="temas-frequentes.html">Padroes que mais caem</a>
      </nav>

      <nav class="footer-column" aria-label="Termos e direitos">
        <h2>Termos e direitos</h2>
        <a href="direitos-termos.html">Documento completo</a>
        <a href="direitos-termos.html#direitos-autorais">Direitos autorais</a>
        <a href="direitos-termos.html#uso-permitido">Uso permitido</a>
        <a href="direitos-termos.html#privacidade">Privacidade</a>
        <a href="direitos-termos.html#conteudo-educacional">Conteudo educacional</a>
        <a href="direitos-termos.html#criador">Criador kzincks</a>
      </nav>
    </div>

    <div class="site-footer-bottom">
      <span>© ${year} AprovAI. Todos os direitos reservados.</span>
      <span>Site, identidade, estrutura e conteudo protegidos. Criador: <strong>kzincks</strong>.</span>
      <a href="direitos-termos.html#contato">Contato e solicitacoes</a>
    </div>
  `;

  main.appendChild(footer);

  if (window.lucide) {
    window.lucide.createIcons();
  }
})();
