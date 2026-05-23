const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "data", "questoes");
const MODULE_COUNT = 10;
const QUESTIONS_PER_AREA = 20;

const areaOrder = ["humanas", "linguagens", "natureza", "matematica"];

const areaLabels = {
  humanas: "Ciências Humanas",
  linguagens: "Linguagens",
  natureza: "Ciências da Natureza",
  matematica: "Matemática"
};

const banks = {
  humanas: [
    ["História", "Colonização espanhola", "Leis Novas de 1542", "A restrição à encomienda indica conflito entre exploração colonial e controle metropolitano.", "redução da exploração indígena sem eliminar a dominação colonial"],
    ["História", "Era Vargas", "Propaganda política", "A construção da imagem do líder aproximava Estado, trabalho e massas urbanas.", "legitimação do poder por comunicação estatal e trabalhismo"],
    ["História", "Guerra Fria", "Muro de Berlim", "A divisão da cidade expressava a ordem bipolar e a disputa ideológica do pós-guerra.", "materialização territorial da rivalidade entre capitalismo e socialismo"],
    ["Geografia", "Urbanização", "Segregação socioespacial", "A expansão urbana desigual empurra população pobre para áreas com menor infraestrutura.", "periferização associada à desigualdade no acesso à cidade"],
    ["Geografia", "Energia e sustentabilidade", "Fontes renováveis", "A energia limpa reduz emissões, mas também exige território, rede e planejamento.", "análise dos limites ambientais e econômicos da transição energética"],
    ["Geografia", "Agronegócio", "Commodities", "A pauta exportadora brasileira concentra produtos primários de alto peso logístico.", "dependência de cadeias globais e vulnerabilidade a preços externos"],
    ["Sociologia", "Racismo estrutural", "Representatividade", "Campanhas antirracistas criticam desigualdades reproduzidas por instituições e práticas sociais.", "questionamento de hierarquias raciais naturalizadas"],
    ["Sociologia", "Trabalho e origem social", "Escolhas profissionais", "O acesso desigual à escola, renda e redes sociais condiciona trajetórias ocupacionais.", "reprodução de desigualdades de classe"],
    ["Filosofia", "Contrato social", "Rousseau", "A vontade geral não é soma de interesses privados, mas orientação para o bem comum.", "legitimidade política baseada na soberania popular"],
    ["Filosofia", "Ética e justiça", "Aristóteles", "A justiça distributiva considera mérito, função e proporção na vida coletiva.", "distribuição proporcional orientada pelo bem comum"]
  ],
  linguagens: [
    ["Português", "Interpretação textual", "Ideia central", "O texto constrói sentido ao relacionar tema, ponto de vista e finalidade comunicativa.", "identificar a tese sustentada pelas pistas do texto"],
    ["Português", "Textos multimodais", "Charge", "A charge combina exagero visual, linguagem verbal e contexto para produzir crítica.", "inferir crítica social a partir da relação entre imagem e fala"],
    ["Português", "Variação linguística", "Registro informal", "O uso de marcas de fala cotidiana pode aproximar emissor e público-alvo.", "reconhecer adequação da linguagem à situação comunicativa"],
    ["Literatura", "Poema", "Memória e identidade", "A voz poética transforma lembrança individual em reflexão coletiva.", "perceber memória como construção simbólica de identidade"],
    ["Artes", "Arte afro-brasileira", "Representação social", "A obra valoriza sujeitos historicamente apagados e disputa a memória visual.", "associar arte à resistência cultural e à representatividade"],
    ["Português", "Artigo de opinião", "Tese e argumento", "A defesa de ponto de vista depende de exemplos, dados e conectores argumentativos.", "distinguir tese de justificativa"],
    ["Inglês", "Cultura digital", "Comportamento social", "O texto em inglês critica rótulos geracionais criados em ambientes de mídia.", "inferir intenção crítica do autor"],
    ["Espanhol", "Variação linguística", "Regionalismo", "O vocabulário hispano-americano muda conforme país, região e situação de uso.", "reconhecer diversidade lexical do espanhol"],
    ["Português", "Campanha social", "Finalidade comunicativa", "Campanhas usam linguagem direta para orientar comportamento coletivo.", "identificar persuasão e público-alvo"],
    ["Português", "Coesão textual", "Conectores", "Conectores organizam causa, oposição, conclusão e progressão temática.", "explicar relação semântica entre partes do texto"]
  ],
  natureza: [
    ["Biologia", "Ecologia", "Bioacumulação", "Substâncias persistentes aumentam sua concentração em organismos ao longo da cadeia alimentar.", "maior concentração em predadores de topo"],
    ["Biologia", "Genética", "Heredograma", "A análise de herança recessiva observa pais, filhos afetados e padrões familiares.", "identificação de alelos e probabilidade de descendentes"],
    ["Biologia", "Vírus", "Proteína spike", "Proteínas virais participam do reconhecimento e entrada em células hospedeiras.", "bloqueio da etapa inicial de infecção"],
    ["Química", "Soluções", "Diluição", "Adicionar solvente reduz concentração sem alterar a quantidade de soluto.", "redução da concentração final"],
    ["Química", "Equilíbrio químico", "Le Chatelier", "O sistema tende a reduzir a perturbação imposta por concentração, pressão ou temperatura.", "deslocamento do equilíbrio para consumir o reagente adicionado"],
    ["Química", "Orgânica", "Funções orgânicas", "Grupos funcionais determinam propriedades e reatividade de moléculas.", "reconhecimento da função pela estrutura"],
    ["Física", "Cinemática", "Velocidade média", "A razão entre deslocamento e tempo permite comparar movimentos em contextos cotidianos.", "cálculo de velocidade a partir de distância e tempo"],
    ["Física", "Eletricidade", "Lei de Ohm", "A relação entre tensão, corrente e resistência organiza o funcionamento de circuitos simples.", "aumento da corrente quando a resistência diminui"],
    ["Física", "Ondulatória", "Efeito Doppler", "Movimento relativo entre fonte e observador altera a frequência percebida.", "som mais agudo na aproximação da fonte"],
    ["Física", "Termologia", "Calor específico", "Materiais diferentes exigem quantidades diferentes de energia para variar temperatura.", "comparação da energia necessária para aquecimento"]
  ],
  matematica: [
    ["Matemática", "Porcentagem", "Desconto percentual", "Um produto de R$ 240 recebe desconto de 15%.", "204"],
    ["Matemática", "Função afim", "Tarifa fixa e variável", "Uma corrida custa R$ 6 de bandeirada e R$ 2,50 por km.", "6 + 2,5x"],
    ["Matemática", "Estatística", "Média aritmética", "As notas 620, 680, 700 e 760 têm média igual a", "690"],
    ["Matemática", "Probabilidade", "Eventos equiprováveis", "Um dado comum é lançado uma vez. A chance de sair número par é", "1/2"],
    ["Matemática", "Combinatória", "Princípio multiplicativo", "Uma senha tem 2 letras e 3 algarismos, sem restrição de repetição.", "26² · 10³"],
    ["Matemática", "Geometria plana", "Área do círculo", "Um círculo de raio 4 cm tem área igual a", "16π cm²"],
    ["Matemática", "Geometria espacial", "Volume de cilindro", "Um cilindro de raio 3 m e altura 5 m tem volume", "45π m³"],
    ["Matemática", "Escala", "Mapas e plantas", "Em escala 1:50 000, 3 cm no mapa representam", "1,5 km"],
    ["Matemática", "Função quadrática", "Máximo e mínimo", "A parábola com concavidade para baixo pode modelar", "valor máximo de receita"],
    ["Matemática", "Matemática financeira", "Custo-benefício", "Comparar preço por unidade evita escolher apenas pela embalagem maior.", "menor custo unitário"]
  ]
};

const wrongOptions = {
  humanas: [
    "substituição completa do trabalho compulsório por trabalho assalariado",
    "ausência de conflitos sociais no espaço colonial",
    "neutralidade política das instituições de comunicação",
    "isolamento total entre economia e território"
  ],
  linguagens: [
    "decorar apenas o significado literal de uma palavra",
    "ignorar o gênero textual e o público-alvo",
    "responder com opinião pessoal sem pista do texto",
    "considerar imagem e texto como elementos sem relação"
  ],
  natureza: [
    "mudança sem relação com causa e efeito",
    "interpretação baseada apenas no nome do conteúdo",
    "aumento de grandeza sem alterar o sistema",
    "conclusão sem evidência experimental ou dado"
  ],
  matematica: [
    "somar valores sem conferir a unidade",
    "usar fórmula sem identificar a grandeza pedida",
    "comparar números de contextos diferentes",
    "ignorar a taxa, escala ou proporção"
  ]
};

function rotate(list, index) {
  return list[index % list.length];
}

function questionStimulus(area, item, seed) {
  const [subject, chapter, topic] = item;

  if (area === "matematica") {
    if (topic.includes("Média")) {
      return {
        type: "table",
        title: "Notas de um estudante",
        text: "Uma escola registrou quatro notas de um estudante em simulados sucessivos.",
        columns: ["Simulado", "1", "2", "3", "4"],
        rows: [["Nota", "620", "680", "700", "760"]]
      };
    }

    if (topic.includes("Tarifa")) {
      return {
        type: "chart",
        title: "Custo de corrida por aplicativo",
        text: "O valor total aumenta de acordo com a distância percorrida.",
        bars: [
          { label: "0 km", value: 6 },
          { label: "4 km", value: 16 },
          { label: "8 km", value: 26 },
          { label: "12 km", value: 36 }
        ]
      };
    }
  }

  if (area === "natureza" && (topic.includes("Bioacumulação") || topic.includes("Diluição") || topic.includes("Lei de Ohm"))) {
    return {
      type: "chart",
      title: `Modelo visual: ${topic}`,
      text: "Os valores simulam a comparação entre etapas de um processo científico.",
      bars: [
        { label: "A", value: 18 + seed },
        { label: "B", value: 32 + seed },
        { label: "C", value: 48 + seed },
        { label: "D", value: 64 + seed }
      ]
    };
  }

  return {
    type: "text",
    title: `${subject}: ${topic}`,
    text: `${item[3]} A questão pede que o estudante relacione o contexto ao conceito de ${topic}, sem depender de memorização solta.`
  };
}

function buildAlternatives(area, correct, seed) {
  const options = [correct, ...wrongOptions[area].map((text, index) => `${text}${index === seed % 4 ? "." : ""}`)];
  const shift = seed % 5;
  return [...options.slice(shift), ...options.slice(0, shift)].slice(0, 5).map((text, index) => ({
    letter: String.fromCharCode(65 + index),
    text
  }));
}

function buildQuestion(moduleNumber, area, localIndex, globalOrder) {
  const item = rotate(banks[area], localIndex + moduleNumber);
  const [subject, chapter, topic, context, correct] = item;
  const seed = moduleNumber * 7 + localIndex;
  const alternatives = buildAlternatives(area, correct, seed);
  const answer = alternatives.find((alternative) => alternative.text === correct)?.letter || "A";

  return {
    id: `mod-${String(moduleNumber).padStart(2, "0")}-${area}-${String(localIndex + 1).padStart(2, "0")}`,
    moduleId: `modulo-${String(moduleNumber).padStart(2, "0")}`,
    order: globalOrder,
    area,
    areaLabel: areaLabels[area],
    subject,
    chapter,
    topic,
    difficulty: localIndex % 5 === 0 ? "desafio" : localIndex % 3 === 0 ? "intermediário" : "essencial",
    reference: {
      exam: "ENEM",
      note: "Treino autoral no padrão ENEM, baseado em habilidades e temas recorrentes de provas anteriores."
    },
    skill: `${subject} - ${chapter}`,
    stimulus: questionStimulus(area, item, seed),
    prompt: buildPrompt(area, topic, context),
    alternatives,
    answer,
    explanation: `A alternativa correta é ${answer}, porque ${correct} é a leitura que melhor conecta o enunciado ao assunto ${topic}. As demais alternativas fogem do comando, exageram a conclusão ou tratam o tema de forma genérica.`,
    review: [
      `Revise ${topic}.`,
      "Volte ao comando da questão antes de escolher a alternativa.",
      "Procure o dado, conceito ou pista textual que sustenta a resposta."
    ],
    tags: [areaLabels[area], subject, chapter, topic]
  };
}

function buildPrompt(area, topic, context) {
  if (area === "matematica") {
    return `Considerando a situação apresentada sobre ${topic}, qual alternativa representa corretamente o raciocínio ou resultado esperado?`;
  }

  if (area === "linguagens") {
    return `No contexto apresentado, o principal efeito de sentido relacionado a ${topic} é`;
  }

  if (area === "natureza") {
    return `A explicação científica mais adequada para a situação relacionada a ${topic} é`;
  }

  return `A situação descrita se relaciona ao tema ${topic} porque evidencia`;
}

function buildModule(moduleNumber) {
  const id = `modulo-${String(moduleNumber).padStart(2, "0")}`;
  const questions = [];
  let order = 1;

  for (const area of areaOrder) {
    for (let index = 0; index < QUESTIONS_PER_AREA; index += 1) {
      questions.push(buildQuestion(moduleNumber, area, index, order));
      order += 1;
    }
  }

  return {
    id,
    title: `Módulo de questões ${moduleNumber}`,
    description: "Treino em blocos: Humanas, Linguagens, Natureza e Matemática, com 20 questões seguidas por área.",
    structure: areaOrder.map((area) => ({
      area,
      areaLabel: areaLabels[area],
      count: QUESTIONS_PER_AREA,
      start: areaOrder.indexOf(area) * QUESTIONS_PER_AREA + 1,
      end: (areaOrder.indexOf(area) + 1) * QUESTIONS_PER_AREA
    })),
    totalQuestions: questions.length,
    questions
  };
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const modules = [];

  for (let moduleNumber = 1; moduleNumber <= MODULE_COUNT; moduleNumber += 1) {
    const module = buildModule(moduleNumber);
    const file = `modulo-${String(moduleNumber).padStart(2, "0")}.json`;
    fs.writeFileSync(path.join(outDir, file), JSON.stringify(module, null, 2));
    modules.push({
      id: module.id,
      title: module.title,
      description: module.description,
      file: `data/questoes/${file}`,
      totalQuestions: module.totalQuestions,
      structure: module.structure
    });
  }

  const index = {
    generatedAt: new Date().toISOString(),
    note: "Banco autoral no padrão ENEM. Não reproduz integralmente itens oficiais.",
    modules,
    totals: {
      modules: MODULE_COUNT,
      questions: MODULE_COUNT * QUESTIONS_PER_AREA * areaOrder.length,
      questionsPerArea: QUESTIONS_PER_AREA,
      areas: areaOrder.length
    }
  };

  fs.writeFileSync(path.join(outDir, "questoes-index.json"), JSON.stringify(index, null, 2));
  console.log(`Generated ${modules.length} ENEM modules in ${outDir}`);
}

main();
