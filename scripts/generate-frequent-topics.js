const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outFile = path.join(root, "data", "questoes", "temas-frequentes.json");

const sources = [
  "data/biblioteca-linguagens.json",
  "data/biblioteca-humanas.json",
  "data/biblioteca-natureza.json",
  "data/biblioteca-matematica.json"
];

const iconByArea = {
  linguagens: "book-open-text",
  humanas: "landmark",
  natureza: "atom",
  matematica: "calculator"
};

const shortLabelByArea = {
  linguagens: "Linguagens",
  humanas: "Ciencias Humanas",
  natureza: "Ciencias da Natureza",
  matematica: "Matematica"
};

const highFrequencyWords = [
  "interpretacao",
  "texto",
  "grafico",
  "tabela",
  "porcentagem",
  "funcao",
  "ecologia",
  "direitos",
  "cidadania",
  "energia",
  "urbanizacao",
  "probabilidade",
  "geometria",
  "campanha",
  "variacao",
  "memoria",
  "racismo",
  "sustentabilidade",
  "concentracao",
  "velocidade",
  "media",
  "escala",
  "volume",
  "eletricidade",
  "colonizacao",
  "literatura"
];

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(text) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 88);
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function getFrequency(topic, collection, area) {
  const haystack = normalize(`${topic} ${collection.title} ${(collection.tags || []).join(" ")}`);
  if (highFrequencyWords.some((word) => haystack.includes(word))) return "Muito recorrente";
  if ((collection.priority || 0) >= 5) return "Muito recorrente";
  if (area === "matematica" || area === "natureza") return "Recorrente";
  return "Aparece com frequencia";
}

function getPriorityScore(topic, collection, area) {
  const frequency = getFrequency(topic, collection, area);
  const base = Number(collection.priority || 3) * 10;
  const bonus = frequency === "Muito recorrente" ? 18 : frequency === "Recorrente" ? 10 : 4;
  return Math.min(100, base + bonus);
}

function getCoreFormulaOrModel(area, topic) {
  const text = normalize(topic);

  if (area === "matematica") {
    if (text.includes("porcent")) return "porcentagem = parte / total; valor final = valor inicial x (1 +/- taxa).";
    if (text.includes("media")) return "media aritmetica = soma dos valores / quantidade de valores.";
    if (text.includes("probabilidade")) return "probabilidade = casos favoraveis / casos possiveis.";
    if (text.includes("combin") || text.includes("arranjo") || text.includes("permut")) return "contagem por etapas; use combinacao quando a ordem nao importa.";
    if (text.includes("area")) return "area: retangulo b x h, triangulo b x h / 2, circulo pi x r^2.";
    if (text.includes("volume")) return "volume de prismas e cilindros = area da base x altura.";
    if (text.includes("func")) return "funcao afim: f(x)=ax+b; quadratica: f(x)=ax^2+bx+c.";
    if (text.includes("escala")) return "escala = medida no desenho / medida real, com unidades compativeis.";
    if (text.includes("velocidade")) return "velocidade media = distancia ou deslocamento / tempo.";
    return "modelo matematico = dados + unidade + operacao + conferencia da resposta.";
  }

  if (area === "natureza") {
    if (text.includes("ph")) return "pH menor indica maior acidez; pH maior indica maior basicidade.";
    if (text.includes("concentr")) return "concentracao comum = massa do soluto / volume da solucao.";
    if (text.includes("velocidade")) return "velocidade media = deslocamento / intervalo de tempo.";
    if (text.includes("potencia")) return "potencia = energia / tempo; em eletricidade, P = U x i.";
    if (text.includes("ohm") || text.includes("resist")) return "Lei de Ohm: U = R x i.";
    if (text.includes("calor")) return "calor sensivel: Q = m x c x variacao de temperatura.";
    if (text.includes("energia")) return "energia se conserva, mas pode mudar de forma e rendimento.";
    return "modelo cientifico = sistema + processo + evidencia + efeito observado.";
  }

  if (area === "humanas") {
    return "modelo de analise = contexto + agentes sociais + interesse em disputa + consequencia.";
  }

  return "modelo de leitura = genero textual + finalidade + linguagem + efeito produzido.";
}

function getAppearsAs(area, subject, chapterTitle, topic) {
  const base = {
    linguagens: [
      `Texto verbal, imagem, campanha, poema, charge ou noticia em que ${topic} constrói sentido.`,
      "Comando pedindo tese, finalidade, critica, publico-alvo, ironia, humor ou efeito de linguagem.",
      "Alternativas que confundem tema geral com sentido especifico do trecho."
    ],
    humanas: [
      `Fonte historica, mapa, grafico social ou texto teorico envolvendo ${topic}.`,
      "Comando pedindo causa, consequencia, permanencia, mudanca, cidadania ou desigualdade.",
      "Alternativas que simplificam processos sociais como se fossem fatos isolados."
    ],
    natureza: [
      `Situacao-problema, experimento, tabela, esquema ou grafico envolvendo ${topic}.`,
      "Comando pedindo mecanismo, relacao de causa e efeito, calculo, evidencia ou impacto.",
      "Alternativas que citam o conceito sem explicar o funcionamento do fenomeno."
    ],
    matematica: [
      `Tabela, grafico, compra, escala, medida, funcao ou situacao cotidiana envolvendo ${topic}.`,
      "Comando pedindo calculo, comparacao, expressao, tendencia, proporcao, area, volume ou probabilidade.",
      "Alternativas com erro de unidade, base percentual, leitura de grafico ou arredondamento."
    ]
  };

  return [
    ...base[area],
    `Dentro de ${subject}, o assunto costuma aparecer conectado ao bloco "${chapterTitle}".`
  ];
}

function getHowToSolve(area, topic) {
  const shared = [
    "Leia o comando antes do texto completo e marque exatamente o que esta sendo pedido.",
    `Identifique onde ${topic} aparece: dado, conceito, imagem, tabela, fala ou situacao-problema.`,
    "Separe informacao util de detalhe decorativo.",
    "Elimine alternativas que respondem outro comando ou exageram a conclusao."
  ];

  const byArea = {
    linguagens: [
      "Relacione genero textual, publico-alvo, escolha de palavras e efeito de sentido.",
      "Quando houver imagem, leia texto verbal e visual juntos.",
      "Responda com base nas pistas do texto, nao por opiniao pessoal."
    ],
    humanas: [
      "Localize tempo, espaco, grupos sociais e interesses em disputa.",
      "Explique a relacao entre processo historico/social e consequencia.",
      "Procure direitos, poder, desigualdade, territorio, trabalho ou cultura envolvidos."
    ],
    natureza: [
      "Separe grandezas, estruturas, processos e efeitos observados.",
      "Quando houver numero, confira unidade e relacao entre variaveis.",
      "Use o dado experimental ou grafico como evidencia para a alternativa."
    ],
    matematica: [
      "Anote valores, unidades, taxas, escalas e a grandeza pedida.",
      "Escolha a operacao antes de calcular: comparar, somar, multiplicar, dividir, modelar ou converter.",
      "Confira se a resposta final tem a unidade e a ordem de grandeza esperadas."
    ]
  };

  return [...shared, ...byArea[area]];
}

function getMistakes(area, topic) {
  const byArea = {
    linguagens: [
      "Responder por palavra-chave sem considerar contexto.",
      "Ignorar ironia, humor, critica ou finalidade comunicativa.",
      "Tratar variacao linguistica como erro automatico."
    ],
    humanas: [
      "Reduzir processo social a uma causa unica.",
      "Confundir opiniao pessoal com analise historica, geografica, sociologica ou filosofica.",
      "Ignorar agentes sociais e relacoes de poder."
    ],
    natureza: [
      "Decorar nome do fenomeno sem explicar o mecanismo.",
      "Comparar dados com unidades diferentes.",
      "Ignorar variavel controlada, etapa do processo ou evidencia experimental."
    ],
    matematica: [
      "Comecar pela conta sem entender a pergunta.",
      "Usar porcentagem sobre a base errada.",
      "Errar conversao de unidade, escala, area ou volume."
    ]
  };

  return [
    ...byArea[area],
    `Confundir ${topic} com um assunto parecido sem voltar ao comando.`
  ];
}

function getSignals(area, topic) {
  const byArea = {
    linguagens: ["finalidade", "efeito de sentido", "critica", "publico-alvo", "linguagem verbal e nao verbal"],
    humanas: ["contexto historico", "territorio", "cidadania", "desigualdade", "poder", "trabalho"],
    natureza: ["experimento", "mecanismo", "concentracao", "energia", "sistema", "impacto"],
    matematica: ["tabela", "grafico", "taxa", "escala", "media", "probabilidade", "volume"]
  };

  return byArea[area].map((signal) => `Se aparecer "${signal}", verifique a relacao com ${topic}.`);
}

function getCommandPatterns(area) {
  const patterns = {
    linguagens: [
      "O efeito de sentido e produzido por...",
      "A finalidade comunicativa do texto e...",
      "A critica presente na imagem se relaciona a...",
      "No texto, a escolha vocabular indica..."
    ],
    humanas: [
      "O processo descrito evidencia...",
      "A consequencia social do fenomeno e...",
      "A fonte permite compreender...",
      "A transformacao apresentada decorre de..."
    ],
    natureza: [
      "O fenomeno ocorre porque...",
      "A intervencao provoca...",
      "A analise dos dados indica...",
      "O resultado experimental se explica por..."
    ],
    matematica: [
      "O valor correspondente e...",
      "A expressao que modela a situacao e...",
      "A alternativa que apresenta a melhor comparacao e...",
      "A medida solicitada, em unidades corretas, e..."
    ]
  };

  return patterns[area];
}

function getVisualReading(area, topic) {
  const byArea = {
    linguagens: [
      "Em charge ou campanha, procure contraste entre imagem e frase.",
      "Em poema, observe repeticao, metafora e tom.",
      "Em anuncio, veja publico-alvo e promessa do texto."
    ],
    humanas: [
      "Em mapa, observe escala, fronteira, concentracao e desigualdade espacial.",
      "Em fonte historica, identifique autor, epoca e interesse.",
      "Em grafico social, relacione dado a processo politico ou economico."
    ],
    natureza: [
      "Em grafico, identifique variavel no eixo e tendencia dos dados.",
      "Em esquema, siga a ordem das etapas do processo.",
      "Em tabela, compare unidades e condicoes experimentais."
    ],
    matematica: [
      "Em tabela, leia titulo, unidade e coluna pedida.",
      "Em grafico, veja eixo, escala, pico, queda e tendencia.",
      "Em figura, marque medidas antes de escolher formula."
    ]
  };

  return byArea[area].map((item) => `${item} Use isso quando o assunto for ${topic}.`);
}

function getResolutionModel(area, topic) {
  return [
    {
      step: "1. Ler o comando",
      detail: `Descubra se a questao quer conceito, calculo, comparacao, causa, consequencia ou efeito de sentido em ${topic}.`
    },
    {
      step: "2. Marcar os dados uteis",
      detail: "Separe texto, numero, unidade, fonte, grafico, imagem ou trecho que sustenta a resposta."
    },
    {
      step: "3. Escolher a estrategia",
      detail: getCoreFormulaOrModel(area, topic)
    },
    {
      step: "4. Eliminar distracoes",
      detail: "Corte alternativas que exageram, trocam unidade, ignoram contexto ou respondem outro comando."
    },
    {
      step: "5. Conferir a resposta",
      detail: "A alternativa final precisa explicar exatamente o que foi pedido, sem extrapolar o enunciado."
    }
  ];
}

function getMiniQuestion(area, topic) {
  const templates = {
    linguagens: {
      prompt: `Um texto sobre ${topic} usa escolhas de linguagem para construir uma critica social. O que sustenta a alternativa correta?`,
      alternatives: [
        "A relacao entre finalidade do texto, contexto e pistas verbais ou visuais.",
        "A opiniao pessoal do leitor sobre o tema.",
        "A palavra mais repetida, mesmo sem analisar o contexto.",
        "A alternativa que resume o assunto de forma mais curta.",
        "A ideia de que todo uso informal da lingua e erro."
      ],
      explanation: `Em Linguagens, ${topic} precisa ser interpretado pelo efeito de sentido produzido no texto.`
    },
    humanas: {
      prompt: `Uma questao apresenta documento, mapa ou texto teorico relacionado a ${topic}. Qual caminho de leitura e mais adequado?`,
      alternatives: [
        "Identificar contexto, agentes sociais, disputa de interesses e consequencias.",
        "Tratar o fato como acontecimento isolado, sem relacao com a sociedade.",
        "Escolher a alternativa que combina com uma opiniao pessoal.",
        "Ignorar tempo, lugar e grupo social citado na fonte.",
        "Ler apenas o titulo e responder por associacao."
      ],
      explanation: `Em Humanas, ${topic} costuma cobrar processo social, poder, cidadania, territorio ou mudanca historica.`
    },
    natureza: {
      prompt: `Em um problema sobre ${topic}, o enunciado traz dados, experimento ou esquema. O que torna a resposta mais segura?`,
      alternatives: [
        "Relacionar causa, mecanismo, evidencia apresentada e efeito observado.",
        "Decorar o nome do fenomeno e ignorar os dados.",
        "Misturar unidades diferentes sem conversao.",
        "Escolher a alternativa com mais termos tecnicos.",
        "Responder sem observar tabela, grafico ou condicao experimental."
      ],
      explanation: `Em Natureza, ${topic} deve ser explicado pelo funcionamento do fenomeno e pelas evidencias do enunciado.`
    },
    matematica: {
      prompt: `Um item do ENEM trabalha ${topic} em uma situacao cotidiana. Qual deve ser o primeiro passo antes de calcular?`,
      alternatives: [
        "Localizar grandezas, unidade, dado pedido e relacao entre os valores.",
        "Aplicar a primeira formula lembrada.",
        "Arredondar todos os numeros antes de entender a pergunta.",
        "Ignorar legenda, escala ou unidade.",
        "Escolher a alternativa numericamente maior."
      ],
      explanation: `Em Matematica, ${topic} exige leitura do modelo antes da conta; isso reduz erro de unidade, base e interpretacao.`
    }
  };

  const template = templates[area];
  return {
    prompt: template.prompt,
    alternatives: template.alternatives.map((text, index) => ({
      letter: "ABCDE"[index],
      text
    })),
    answer: "A",
    explanation: template.explanation
  };
}

function getPracticeModels(area, topic) {
  return [
    {
      title: `Modelo frequente: ${topic}`,
      situation: `O enunciado apresenta uma situacao real, texto, grafico, fonte, experimento ou dado relacionado a ${topic}.`,
      task: "Escolher a alternativa que melhor explica o fenomeno, sentido, calculo ou consequencia.",
      answerStrategy: "Voltar ao comando, localizar a pista principal e justificar a alternativa com base no contexto."
    },
    {
      title: `Modelo de revisao: ${topic}`,
      situation: `Depois de errar uma questao sobre ${topic}, o aluno compara a alternativa marcada com o gabarito.`,
      task: "Identificar se o erro foi de leitura, conceito, calculo, unidade ou extrapolacao.",
      answerStrategy: "Registrar o tipo de erro e resolver outra questao do mesmo padrao."
    }
  ];
}

function buildTheme(area, areaLabel, collection, chapter, topic, topicIndex, nearTopics) {
  return {
    id: `${area}-${slugify(collection.id)}-${slugify(topic)}-${topicIndex}`,
    title: topic,
    area,
    areaLabel,
    subject: collection.subject,
    bookletId: collection.id,
    bookletTitle: collection.title,
    chapterTitle: chapter.title,
    frequency: getFrequency(topic, collection, area),
    priority: getPriorityScore(topic, collection, area),
    difficulty: collection.difficulty || "intermediario",
    estimatedReviewMinutes: Math.max(12, Math.min(38, 12 + Math.round((collection.estimatedMinutes || 120) / 18))),
    tags: uniq([...(collection.tags || []), collection.subject, chapter.title, topic, areaLabel]).slice(0, 16),
    relatedTopics: nearTopics.filter((item) => item !== topic).slice(0, 8),
    whyFrequent: `${topic} e importante no ENEM porque costuma aparecer em situacoes contextualizadas dentro de ${collection.subject}, exigindo leitura atenta, aplicacao do conceito e eliminacao de distratores.`,
    appearsAs: getAppearsAs(area, collection.subject, chapter.title, topic),
    howToSolve: getHowToSolve(area, topic),
    commonMistakes: getMistakes(area, topic),
    questionSignals: getSignals(area, topic),
    commandPatterns: getCommandPatterns(area),
    visualReading: getVisualReading(area, topic),
    coreFormulaOrModel: getCoreFormulaOrModel(area, topic),
    resolutionModel: getResolutionModel(area, topic),
    miniQuestion: getMiniQuestion(area, topic),
    practiceModels: getPracticeModels(area, topic),
    studyPath: [
      `Leia o resumo da apostila "${collection.title}".`,
      `Revise o capitulo "${chapter.title}".`,
      `Resolva uma questao que misture ${topic} com texto, tabela, grafico, imagem ou situacao cotidiana.`,
      "Explique em voz alta por que a alternativa correta responde ao comando.",
      "Anote o erro mais provavel para revisar depois."
    ],
    reviewChecklist: [
      "Comando da questao identificado.",
      "Dado ou trecho de apoio marcado.",
      "Distratores eliminados com justificativa.",
      "Resposta final conferida com o contexto."
    ],
    relatedSkills: collection.skills || [],
    bookletChecklist: collection.checklist || []
  };
}

function buildArea(sourcePath) {
  const source = JSON.parse(fs.readFileSync(path.join(root, sourcePath), "utf8"));
  const collections = source.collections.map((collection) => {
    const themes = collection.chapters.flatMap((chapter, chapterIndex) =>
      chapter.topics.map((topic, topicIndex) =>
        buildTheme(
          source.area,
          source.areaLabel,
          collection,
          chapter,
          topic,
          chapterIndex * 1000 + topicIndex,
          chapter.topics
        )
      )
    );

    return {
      id: collection.id,
      title: collection.title,
      subject: collection.subject,
      difficulty: collection.difficulty,
      priority: collection.priority,
      estimatedMinutes: collection.estimatedMinutes,
      summary: collection.summary,
      whyEnem: collection.whyEnem,
      themes
    };
  });

  const themes = collections.flatMap((collection) => collection.themes);
  const subjects = uniq(collections.map((collection) => collection.subject)).sort();

  return {
    area: source.area,
    areaLabel: source.areaLabel,
    shortLabel: shortLabelByArea[source.area] || source.areaLabel,
    icon: iconByArea[source.area] || source.icon || "badge-help",
    summary: source.priorityMessage,
    totals: {
      collections: collections.length,
      themes: themes.length,
      subjects: subjects.length
    },
    subjects,
    collections
  };
}

function main() {
  const areas = sources.map(buildArea);
  const totals = {
    areas: areas.length,
    collections: areas.reduce((sum, area) => sum + area.totals.collections, 0),
    themes: areas.reduce((sum, area) => sum + area.totals.themes, 0),
    subjects: uniq(areas.flatMap((area) => area.subjects)).length
  };

  const output = {
    title: "Temas frequentes no ENEM",
    description: "Banco robusto de assuntos recorrentes, padroes de questao, modelos de resolucao, erros comuns e miniquestoes.",
    generatedAt: new Date().toISOString(),
    source: "Gerado a partir dos arquivos da biblioteca do SaaS ENEM.",
    note: "Conteudo autoral de orientacao e treino baseado em assuntos recorrentes do ENEM. Nao reproduz integralmente questoes oficiais.",
    totals,
    areas
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`Generated ${totals.themes} frequent ENEM themes at ${outFile}`);
}

main();
