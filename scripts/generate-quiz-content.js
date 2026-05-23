const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "data", "quiz");
const indexFile = path.join(root, "data", "aulas", "aulas-index.json");

const areaConfig = {
  linguagens: { icon: "languages", label: "Linguagens, Códigos e suas Tecnologias" },
  humanas: { icon: "landmark", label: "Ciências Humanas e suas Tecnologias" },
  natureza: { icon: "atom", label: "Ciências da Natureza e suas Tecnologias" },
  matematica: { icon: "calculator", label: "Matemática e suas Tecnologias" }
};

const difficultyCycle = ["essencial", "intermediário", "desafio"];

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function simplify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function optionSet(correct, wrongA, wrongB, wrongC, wrongD, offset) {
  const options = [
    { text: correct, correct: true },
    { text: wrongA, correct: false },
    { text: wrongB, correct: false },
    { text: wrongC, correct: false },
    { text: wrongD, correct: false }
  ];
  const shift = offset % options.length;
  return [...options.slice(shift), ...options.slice(0, shift)];
}

function chart(title, data, note) {
  return {
    type: "bar",
    title,
    xLabel: "Categorias",
    yLabel: "Valor",
    data,
    note
  };
}

function table(title, columns, rows) {
  return {
    type: "table",
    title,
    columns,
    rows
  };
}

function baseProfile(booklet, lesson) {
  const topic = lesson.title;
  const subject = booklet.subject;
  const area = booklet.area;
  const byArea = {
    matematica: {
      stimulusTitle: "Situação matemática",
      stimulusText: `Um exercício de ${subject} trabalha ${topic} em uma situação com valores, unidades e comparação de resultados.`,
      chart: chart(`Relação numérica em ${topic}`, [
        { label: "valor inicial", value: 12 },
        { label: "valor final", value: 18 },
        { label: "variação", value: 6 }
      ], "O modelo visual mostra a relação entre dados usados no cálculo."),
      table: table(`Dados para ${topic}`, ["Grandeza", "Valor"], [["inicial", "12"], ["final", "18"], ["diferença", "6"]]),
      question: {
        prompt: `Em uma situação de ${topic}, uma quantidade passou de 12 para 18. Qual afirmação está correta?`,
        correct: "A variação absoluta foi 6 e o aumento percentual foi de 50%.",
        wrongA: "A variação absoluta foi 30, pois os valores devem ser somados.",
        wrongB: "O aumento percentual foi de 6%, pois basta observar a diferença.",
        wrongC: "O valor final é menor que o inicial, pois 18 vem depois de 12.",
        wrongD: "Não existe relação entre os valores, pois toda comparação exige gráfico."
      },
      explanation: "A diferença é 18 - 12 = 6. Como a base é 12, o aumento percentual é 6/12 = 0,5 = 50%."
    },
    natureza: {
      stimulusTitle: "Situação científica",
      stimulusText: `Em uma aula de ${subject}, estudantes analisam ${topic} para entender como estruturas, processos ou interações produzem determinado efeito na natureza.`,
      chart: chart(`Fatores ligados a ${topic}`, [
        { label: "estrutura", value: 55 },
        { label: "processo", value: 75 },
        { label: "efeito", value: 65 }
      ], "Em Ciências da Natureza, a resposta costuma ligar causa, processo e consequência."),
      table: table(`Análise de ${topic}`, ["Elemento", "Papel no fenômeno"], [["estrutura", "participa do processo"], ["condição", "altera o resultado"], ["efeito", "consequência observável"]]),
      question: {
        prompt: `Qual afirmação explica melhor ${topic} em um contexto de ${subject}?`,
        correct: `${topic} deve ser relacionado a estruturas ou processos que produzem efeitos observáveis no organismo, no ambiente ou no sistema estudado.`,
        wrongA: `${topic} é sempre um fenômeno sem causa e sem relação com o ambiente.`,
        wrongB: `${topic} ocorre apenas quando não há troca de matéria ou energia.`,
        wrongC: `${topic} elimina a necessidade de observar evidências experimentais.`,
        wrongD: `${topic} só pode ser explicado por opinião, sem relação com conceitos científicos.`
      },
      explanation: `Em ${subject}, ${topic} precisa ser explicado por relações entre estrutura, processo, condição e efeito observável.`
    },
    linguagens: {
      stimulusTitle: "Texto de apoio",
      stimulusText: `A escola abriu as portas para uma feira cultural. Nos cartazes, estudantes misturaram poemas, fotografias e relatos de memória para mostrar que a linguagem também preserva histórias da comunidade.`,
      chart: chart(`Construção de sentido em ${topic}`, [
        { label: "texto verbal", value: 70 },
        { label: "imagem", value: 60 },
        { label: "contexto", value: 80 }
      ], "Em Linguagens, o sentido nasce da relação entre forma, contexto e intenção."),
      table: table(`Leitura de ${topic}`, ["Recurso", "Efeito"], [["poemas", "expressam subjetividade"], ["fotografias", "acionam memória visual"], ["relatos", "registram experiência coletiva"]]),
      question: {
        prompt: `Considerando o texto, como ${topic} aparece na construção de sentido?`,
        correct: "A linguagem articula diferentes recursos para valorizar memória, identidade e experiência coletiva.",
        wrongA: "O texto defende que imagens impedem a interpretação de uma mensagem.",
        wrongB: "O sentido depende apenas de regras gramaticais isoladas.",
        wrongC: "A feira cultural é apresentada como um evento sem função comunicativa.",
        wrongD: "Os relatos anulam a participação dos poemas e das fotografias."
      },
      explanation: "O texto combina gêneros e recursos para construir uma mensagem sobre memória e identidade coletiva."
    },
    humanas: {
      stimulusTitle: "Fonte social",
      stimulusText: `Uma fonte didática sobre ${topic} mostra que processos sociais, políticos e territoriais envolvem grupos diferentes, interesses em disputa e consequências para a vida coletiva.`,
      chart: chart(`Dimensões de ${topic}`, [
        { label: "poder", value: 70 },
        { label: "território", value: 55 },
        { label: "sociedade", value: 80 }
      ], "Em Ciências Humanas, fenômenos são analisados por contexto, conflito, permanência e mudança."),
      table: table(`Leitura de ${topic}`, ["Dimensão", "Questão analisada"], [["política", "disputa de poder"], ["social", "grupos envolvidos"], ["histórica", "mudanças e permanências"]]),
      question: {
        prompt: `Qual interpretação sobre ${topic} é mais adequada em ${subject}?`,
        correct: `${topic} deve ser entendido como processo ligado a relações de poder, contexto histórico e impactos sociais.`,
        wrongA: `${topic} pode ser explicado sem considerar grupos sociais ou contexto histórico.`,
        wrongB: `${topic} elimina conflitos e desigualdades de todos os períodos analisados.`,
        wrongC: `${topic} é um fato natural, sem participação humana ou política.`,
        wrongD: `${topic} não tem relação com transformações sociais.`
      },
      explanation: `Em ${subject}, ${topic} é analisado por contexto, relações de poder, sujeitos históricos e efeitos sociais.`
    }
  };

  const profile = byArea[area] || byArea.linguagens;

  return {
    title: topic,
    stimulusTitle: profile.stimulusTitle,
    stimulusText: profile.stimulusText,
    chart: profile.chart,
    table: profile.table,
    questions: [
      {
        prompt: profile.question.prompt,
        alternatives: optionSet(
          profile.question.correct,
          profile.question.wrongA,
          profile.question.wrongB,
          profile.question.wrongC,
          profile.question.wrongD,
          0
        ),
        explanation: profile.explanation
      }
    ]
  };
}

function profileForMath(booklet, lesson, key) {
  if (hasAny(key, ["porcentagem", "percentual", "desconto", "aumento"])) {
    return {
      stimulusTitle: "Promoção e variação percentual",
      stimulusText: "Uma loja aumentou um produto de R$ 80,00 para R$ 100,00 e depois anunciou desconto de 20% sobre o novo preço.",
      chart: chart("Variação de preço", [
        { label: "Preço inicial", value: 80 },
        { label: "Após aumento", value: 100 },
        { label: "Com desconto", value: 80 }
      ], "Percentuais sucessivos não devem ser somados sem considerar a base de cálculo."),
      table: table("Bases de cálculo", ["Etapa", "Base usada", "Resultado"], [
        ["Aumento", "80", "100"],
        ["Desconto", "100", "80"],
        ["Variação final", "80 para 80", "0%"]
      ]),
      questions: [
        {
          prompt: "Qual conclusão correta sobre a situação?",
          alternatives: optionSet("O desconto de 20% foi calculado sobre R$ 100,00, então o preço voltou para R$ 80,00.", "O preço final ficou R$ 64,00 porque 20% deve ser tirado do valor inicial.", "A variação final foi aumento de 20%, pois houve aumento antes do desconto.", "O desconto anula qualquer aumento apenas quando os percentuais são iguais.", "O preço final não pode ser calculado sem saber o lucro da loja.", 1),
          explanation: "Em porcentagem, a base importa. O desconto de 20% usa R$ 100,00 como referência, resultando em R$ 80,00."
        }
      ]
    };
  }

  if (hasAny(key, ["razao", "proporcao", "regra de tres", "diretamente", "inversamente"])) {
    return {
      stimulusTitle: "Grandezas proporcionais",
      stimulusText: "Para produzir 24 apostilas, uma gráfica usa 6 pacotes de papel. Mantendo a mesma proporção, deseja produzir 40 apostilas.",
      chart: chart("Produção e pacotes", [
        { label: "24 apostilas", value: 6 },
        { label: "40 apostilas", value: 10 }
      ], "A razão entre apostilas e pacotes deve permanecer constante."),
      table: table("Regra de três", ["Apostilas", "Pacotes"], [["24", "6"], ["40", "x"]]),
      questions: [
        {
          prompt: "Qual cálculo representa corretamente a situação?",
          alternatives: optionSet("24/6 = 40/x, portanto x = 10 pacotes.", "24 + 6 = 40 + x, portanto x = -10 pacotes.", "24 x 6 = 40 + x, portanto x = 104 pacotes.", "40/24 = x + 6, portanto x é menor que 1 pacote.", "Basta subtrair 40 - 24 e usar 16 pacotes.", 2),
          explanation: "A produção aumenta mantendo a razão 4 apostilas por pacote. Para 40 apostilas, são necessários 10 pacotes."
        }
      ]
    };
  }

  if (hasAny(key, ["funcao afim", "linear", "valor fixo", "tarifa", "1o grau"])) {
    return {
      stimulusTitle: "Modelo de tarifa",
      stimulusText: "Um aplicativo cobra R$ 5,00 fixos mais R$ 2,00 por quilômetro rodado. A função C(x) representa o custo em reais para x quilômetros.",
      chart: chart("Custo por distância", [
        { label: "0 km", value: 5 },
        { label: "5 km", value: 15 },
        { label: "10 km", value: 25 }
      ], "A taxa fixa aparece mesmo quando x é zero."),
      table: table("Função afim", ["x", "C(x)"], [["0", "5"], ["5", "15"], ["10", "25"]]),
      questions: [
        {
          prompt: "Qual função modela o custo da corrida?",
          alternatives: optionSet("C(x) = 5 + 2x", "C(x) = 5x + 2", "C(x) = 7x", "C(x) = 2/x + 5", "C(x) = x² + 5", 3),
          explanation: "O valor fixo é 5 e o valor variável cresce 2 reais a cada quilômetro: C(x) = 5 + 2x."
        }
      ]
    };
  }

  if (hasAny(key, ["media", "estatistica", "grafico", "tabela", "frequencia", "setores", "barras"])) {
    return {
      stimulusTitle: "Leitura de dados",
      stimulusText: "Uma turma teve notas 600, 620, 680, 700 e 750 em um simulado. O professor quer uma medida simples de desempenho geral.",
      chart: chart("Notas do simulado", [
        { label: "A", value: 600 },
        { label: "B", value: 620 },
        { label: "C", value: 680 },
        { label: "D", value: 700 },
        { label: "E", value: 750 }
      ], "A média aritmética soma os valores e divide pela quantidade de dados."),
      table: table("Cálculo da média", ["Soma das notas", "Quantidade", "Média"], [["3350", "5", "670"]]),
      questions: [
        {
          prompt: "Qual é a média aritmética das notas?",
          alternatives: optionSet("670", "650", "680", "700", "3350", 4),
          explanation: "Somando as notas, temos 3350. Dividindo por 5 estudantes, a média é 670."
        }
      ]
    };
  }

  if (hasAny(key, ["probabilidade", "combinatoria", "arranjo", "combinacao", "permutacao", "senha", "contagem"])) {
    return {
      stimulusTitle: "Contagem de possibilidades",
      stimulusText: "Uma senha tem 3 algarismos distintos escolhidos entre 1, 2, 3, 4 e 5. A ordem dos algarismos importa.",
      chart: chart("Escolhas por posição", [
        { label: "1ª posição", value: 5 },
        { label: "2ª posição", value: 4 },
        { label: "3ª posição", value: 3 }
      ], "Quando a ordem importa, multiplicamos as escolhas disponíveis em cada etapa."),
      table: table("Princípio multiplicativo", ["Posição", "Possibilidades"], [["Primeira", "5"], ["Segunda", "4"], ["Terceira", "3"]]),
      questions: [
        {
          prompt: "Quantas senhas diferentes podem ser formadas?",
          alternatives: optionSet("60", "15", "30", "125", "10", 0),
          explanation: "São 5 escolhas para a primeira posição, 4 para a segunda e 3 para a terceira: 5 x 4 x 3 = 60."
        }
      ]
    };
  }

  if (hasAny(key, ["cilindro", "volume", "prisma", "cubo", "tanque", "capacidade", "geometria espacial"])) {
    return {
      stimulusTitle: "Volume e capacidade",
      stimulusText: "Um reservatório em forma de cilindro tem raio de 2 m e altura de 5 m. Use π = 3 para estimar o volume.",
      chart: chart("Dimensões do cilindro", [
        { label: "raio", value: 2 },
        { label: "altura", value: 5 },
        { label: "π adotado", value: 3 }
      ], "Para cilindro, use V = πr²h."),
      table: table("Fórmula aplicada", ["Fórmula", "Substituição", "Volume"], [["V = πr²h", "3 x 2² x 5", "60 m³"]]),
      questions: [
        {
          prompt: "Qual é o volume estimado do reservatório?",
          alternatives: optionSet("60 m³", "30 m³", "20 m³", "100 m³", "12 m³", 1),
          explanation: "O volume do cilindro é V = πr²h. Assim, V = 3 x 4 x 5 = 60 m³."
        }
      ]
    };
  }

  if (hasAny(key, ["area", "circulo", "triangulo", "pitagoras", "semelhanca", "escala", "geometria plana"])) {
    return {
      stimulusTitle: "Geometria em planta",
      stimulusText: "Em uma planta com escala 1:100, um jardim retangular mede 4 cm por 3 cm no desenho.",
      chart: chart("Medidas no desenho", [
        { label: "largura", value: 4 },
        { label: "altura", value: 3 }
      ], "Na escala 1:100, cada centímetro no desenho representa 100 cm na realidade."),
      table: table("Conversão de escala", ["Medida no desenho", "Medida real"], [["4 cm", "4 m"], ["3 cm", "3 m"]]),
      questions: [
        {
          prompt: "Qual é a área real do jardim?",
          alternatives: optionSet("12 m²", "7 m²", "120 m²", "1200 m²", "1,2 m²", 2),
          explanation: "As medidas reais são 4 m e 3 m. A área do retângulo é 4 x 3 = 12 m²."
        }
      ]
    };
  }

  return null;
}

function profileForNature(booklet, lesson, key) {
  if (hasAny(key, ["protozoario", "protozoarios"])) {
    return {
      stimulusTitle: "Protozoários em água contaminada",
      stimulusText: "Após uma enchente, moradores de uma comunidade passaram a consumir água sem tratamento. Dias depois, aumentaram os casos de diarreia, dor abdominal e desidratação. A investigação apontou presença de protozoários intestinais na água.",
      chart: chart("Risco de contaminação por protozoários", [
        { label: "água filtrada", value: 15 },
        { label: "água fervida", value: 8 },
        { label: "água sem tratamento", value: 85 }
      ], "Protozoários podem ser transmitidos pela ingestão de água ou alimentos contaminados."),
      table: table("Características dos protozoários", ["Característica", "Descrição"], [["tipo celular", "eucarionte"], ["nutrição", "heterotrófica na maioria dos casos"], ["ambiente", "água, solo úmido ou interior de hospedeiros"]]),
      questions: [
        {
          prompt: "A presença de protozoários na água explica o aumento de doenças porque esses organismos",
          alternatives: optionSet("são eucariontes unicelulares e algumas espécies parasitas infectam o sistema digestório humano.", "são vírus formados apenas por cápsula proteica e DNA ou RNA.", "são plantas microscópicas que fazem fotossíntese obrigatória no intestino.", "são bactérias pluricelulares com tecidos especializados.", "são animais vertebrados que se reproduzem apenas em água salgada.", 1),
          explanation: "Protozoários são organismos eucariontes, geralmente unicelulares; algumas espécies parasitas podem causar doenças intestinais quando ingeridas em água contaminada."
        }
      ]
    };
  }

  if (hasAny(key, ["pseudopode", "pseudopodes", "movimento celular"])) {
    return {
      stimulusTitle: "Movimento ameboide",
      stimulusText: "Em uma lâmina, uma ameba muda sua forma e projeta expansões temporárias do citoplasma para se deslocar e capturar partículas de alimento.",
      chart: chart("Funções dos pseudópodes", [
        { label: "locomoção", value: 80 },
        { label: "captura", value: 70 },
        { label: "digestão", value: 35 }
      ], "Pseudópodes são prolongamentos temporários usados no movimento e na alimentação."),
      table: table("Ameba e pseudópodes", ["Estrutura", "Função"], [["pseudópode", "deslocamento e captura"], ["citoplasma", "forma prolongamentos"], ["vacúolo digestivo", "digestão intracelular"]]),
      questions: [
        {
          prompt: "Na ameba, os pseudópodes são importantes principalmente porque",
          alternatives: optionSet("permitem locomoção e captura de alimento por projeções temporárias do citoplasma.", "produzem sementes resistentes ao calor.", "transportam oxigênio pelo sangue do organismo.", "formam uma parede celular rígida de celulose.", "armazenam DNA fora do núcleo em todos os seres vivos.", 2),
          explanation: "Pseudópodes são extensões temporárias do citoplasma associadas ao movimento ameboide e à fagocitose."
        }
      ]
    };
  }

  if (hasAny(key, ["estrutura celular", "organela", "eucariotica", "procarotica", "membrana plasmatica", "citologia"])) {
    return {
      stimulusTitle: "Organização celular",
      stimulusText: "Uma célula observada ao microscópio apresenta membrana plasmática, citoplasma, núcleo definido e organelas membranosas.",
      chart: chart("Componentes celulares observados", [
        { label: "membrana", value: 70 },
        { label: "núcleo", value: 90 },
        { label: "organelas", value: 85 }
      ], "A presença de núcleo delimitado por membrana indica célula eucariótica."),
      table: table("Comparação celular", ["Tipo", "Característica"], [["procariótica", "sem núcleo delimitado"], ["eucariótica", "núcleo e organelas membranosas"], ["membrana", "controle de entrada e saída"]]),
      questions: [
        {
          prompt: "A célula descrita deve ser classificada como",
          alternatives: optionSet("eucariótica, porque possui núcleo definido e organelas membranosas.", "procariótica, porque possui núcleo delimitado por carioteca.", "viral, porque apresenta metabolismo próprio completo.", "acelular, porque tem citoplasma e organelas.", "bacteriana obrigatória, porque toda célula com núcleo é bactéria.", 3),
          explanation: "Células eucarióticas possuem núcleo delimitado e organelas membranosas; células procarióticas não têm núcleo definido."
        }
      ]
    };
  }

  if (hasAny(key, ["osmose", "difusao", "transporte de substancias", "membrana"])) {
    return {
      stimulusTitle: "Transporte pela membrana",
      stimulusText: "Uma célula foi colocada em meio hipertônico. Depois de alguns minutos, perdeu água e teve redução de volume.",
      chart: chart("Movimento de água", [
        { label: "interior da célula", value: 35 },
        { label: "meio externo", value: 80 }
      ], "Na osmose, a água se desloca através da membrana em resposta à diferença de concentração."),
      table: table("Osmose", ["Meio", "Efeito na célula"], [["hipotônico", "ganha água"], ["hipertônico", "perde água"], ["isotônico", "equilíbrio"]]),
      questions: [
        {
          prompt: "A redução do volume celular ocorreu porque",
          alternatives: optionSet("a água saiu da célula por osmose em direção ao meio mais concentrado.", "o sal entrou no núcleo e virou glicose.", "a membrana deixou de existir no meio hipertônico.", "a água sempre entra na célula, independentemente do meio.", "a célula produziu parede celular animal para perder volume.", 4),
          explanation: "Em meio hipertônico, a água tende a sair da célula por osmose, reduzindo seu volume."
        }
      ]
    };
  }

  if (hasAny(key, ["bacteria", "fungo", "microorganismo", "aerobio", "anaerobio", "fermentacao"])) {
    return {
      stimulusTitle: "Metabolismo microbiano",
      stimulusText: "Em uma embalagem de alimento sem oxigênio, certos micro-organismos continuam obtendo energia por fermentação, alterando cheiro, sabor e textura do produto.",
      chart: chart("Crescimento microbiano", [
        { label: "refrigerado", value: 25 },
        { label: "temperatura ambiente", value: 70 },
        { label: "sem higiene", value: 90 }
      ], "Temperatura, oxigênio, água e nutrientes influenciam a multiplicação de micro-organismos."),
      table: table("Respiração e fermentação", ["Processo", "Condição"], [["aeróbio", "usa O2"], ["anaeróbio", "não usa O2"], ["fermentação", "gera energia sem oxigênio"]]),
      questions: [
        {
          prompt: "A deterioração do alimento em ambiente sem oxigênio pode ocorrer porque",
          alternatives: optionSet("alguns micro-organismos realizam fermentação e obtêm energia mesmo na ausência de O2.", "todo micro-organismo morre imediatamente sem oxigênio.", "fungos e bactérias não possuem metabolismo energético.", "a fermentação transforma alimento em material estéril.", "a ausência de oxigênio impede qualquer reação química.", 0),
          explanation: "Anaeróbios e anaeróbios facultativos podem manter metabolismo sem oxigênio, muitas vezes por fermentação."
        }
      ]
    };
  }

  if (hasAny(key, ["virus", "viral", "retrovirus", "hiv", "htlv", "spike"])) {
    return {
      stimulusTitle: "Infecção viral",
      stimulusText: "Um vírus usa proteínas de superfície para reconhecer células do hospedeiro e inserir seu material genético, passando a usar a maquinaria celular para produzir novas partículas virais.",
      chart: chart("Etapas da infecção viral", [
        { label: "adesão", value: 55 },
        { label: "entrada", value: 70 },
        { label: "replicação", value: 90 },
        { label: "liberação", value: 65 }
      ], "Vírus dependem da célula hospedeira para se multiplicar."),
      table: table("Vírus", ["Característica", "Descrição"], [["organização", "acelular"], ["material genético", "DNA ou RNA"], ["replicação", "depende da célula hospedeira"]]),
      questions: [
        {
          prompt: "Por que vírus são parasitas intracelulares obrigatórios?",
          alternatives: optionSet("Porque dependem da maquinaria da célula hospedeira para produzir novas partículas virais.", "Porque possuem ribossomos próprios e fazem fotossíntese.", "Porque são células eucarióticas com núcleo completo.", "Porque se reproduzem por sementes no ambiente.", "Porque realizam mitose independente fora de qualquer célula.", 1),
          explanation: "Vírus não têm metabolismo celular completo e precisam usar estruturas da célula hospedeira para se replicar."
        }
      ]
    };
  }

  if (hasAny(key, ["concentracao", "molar", "diluicao", "solucao", "ph", "acido", "base"])) {
    return {
      stimulusTitle: "Solução e concentração",
      stimulusText: "Um estudante dissolve 10 g de sal em água suficiente para formar 2 L de solução.",
      chart: chart("Dados da solução", [
        { label: "massa", value: 10 },
        { label: "volume", value: 2 },
        { label: "concentração", value: 5 }
      ], "Na concentração comum, C = massa do soluto / volume da solução."),
      table: table("Cálculo", ["Grandeza", "Valor"], [["massa", "10 g"], ["volume", "2 L"], ["C", "5 g/L"]]),
      questions: [
        {
          prompt: "Qual é a concentração comum da solução?",
          alternatives: optionSet("5 g/L", "20 g/L", "12 g/L", "0,2 g/L", "10 g/L", 1),
          explanation: "A concentração comum é C = m/V. Logo, C = 10/2 = 5 g/L."
        }
      ]
    };
  }

  if (hasAny(key, ["genetica", "heredograma", "dna", "alelo", "cromossomo", "mutacao", "pcr"])) {
    return {
      stimulusTitle: "Herança e material genético",
      stimulusText: "Em uma família, uma característica recessiva aparece em um filho, embora os pais não apresentem a característica.",
      chart: chart("Probabilidade em cruzamento Aa x Aa", [
        { label: "AA", value: 25 },
        { label: "Aa", value: 50 },
        { label: "aa", value: 25 }
      ], "Em herança recessiva, o fenótipo aparece quando o indivíduo recebe dois alelos recessivos."),
      table: table("Cruzamento", ["Gametas", "A", "a"], [["A", "AA", "Aa"], ["a", "Aa", "aa"]]),
      questions: [
        {
          prompt: "Qual explicação é mais adequada para o filho apresentar a característica recessiva?",
          alternatives: optionSet("Os pais podem ser heterozigotos e transmitir o alelo recessivo ao filho.", "A característica recessiva sempre aparece em todos os filhos.", "Apenas o pai transmite genes aos filhos.", "O ambiente elimina a participação dos alelos.", "Todo filho de pais saudáveis será geneticamente igual.", 2),
          explanation: "Pais heterozigotos podem não apresentar a característica, mas cada um pode transmitir o alelo recessivo."
        }
      ]
    };
  }

  if (hasAny(key, ["ecologia", "carbono", "nitrogenio", "cadeia alimentar", "bioacumulacao", "biodiversidade", "desmatamento", "saneamento"])) {
    return {
      stimulusTitle: "Ecossistema e impacto ambiental",
      stimulusText: "Um rio recebe poluentes persistentes. Pequenos organismos absorvem a substância, peixes pequenos os consomem e peixes maiores acumulam maior concentração.",
      chart: chart("Concentração por nível trófico", [
        { label: "plâncton", value: 5 },
        { label: "peixe pequeno", value: 20 },
        { label: "peixe grande", value: 70 }
      ], "Substâncias persistentes podem aumentar sua concentração ao longo da cadeia alimentar."),
      table: table("Cadeia alimentar", ["Nível", "Efeito"], [["produtores/pequenos organismos", "absorção inicial"], ["consumidores", "acúmulo"], ["topo da cadeia", "maior risco"]]),
      questions: [
        {
          prompt: "O fenômeno descrito é melhor explicado por qual conceito?",
          alternatives: optionSet("Biomagnificação, pois a concentração aumenta nos níveis tróficos superiores.", "Fotossíntese, pois o poluente vira energia luminosa.", "Mutualismo, pois todos os organismos se beneficiam.", "Evaporação, pois a substância some da cadeia alimentar.", "Comensalismo, pois apenas um organismo usa abrigo.", 3),
          explanation: "Na biomagnificação, substâncias persistentes se concentram mais em organismos do topo da cadeia."
        }
      ]
    };
  }

  if (hasAny(key, ["forca", "velocidade", "newton", "impulso", "colisao", "movimento", "mecanica"])) {
    return {
      stimulusTitle: "Segurança no trânsito",
      stimulusText: "Em uma colisão, o airbag aumenta o tempo de desaceleração do corpo do passageiro.",
      chart: chart("Tempo de colisão e força média", [
        { label: "sem airbag", value: 90 },
        { label: "com airbag", value: 35 }
      ], "Para a mesma variação de quantidade de movimento, aumentar o tempo reduz a força média."),
      table: table("Impulso", ["Relação", "Interpretação"], [["I = F x Δt", "mesmo impulso"], ["maior Δt", "menor força média"]]),
      questions: [
        {
          prompt: "Por que o airbag ajuda a proteger o passageiro?",
          alternatives: optionSet("Porque aumenta o tempo de interação e reduz a força média sobre o corpo.", "Porque elimina a inércia do passageiro.", "Porque aumenta a velocidade final do corpo.", "Porque impede qualquer transferência de energia.", "Porque torna a massa do passageiro nula.", 4),
          explanation: "O impulso depende de força e tempo. Aumentar o tempo de colisão reduz a força média."
        }
      ]
    };
  }

  if (hasAny(key, ["corrente", "resistencia", "ohm", "circuito", "potencia", "eletricidade", "capacitor"])) {
    return {
      stimulusTitle: "Circuito elétrico",
      stimulusText: "Uma lâmpada de resistência 20 Ω é ligada a uma bateria de 10 V. Considere a Lei de Ohm.",
      chart: chart("Dados elétricos", [
        { label: "tensão", value: 10 },
        { label: "resistência", value: 20 },
        { label: "corrente x10", value: 5 }
      ], "Pela Lei de Ohm, U = R x i."),
      table: table("Lei de Ohm", ["Fórmula", "Substituição", "Resultado"], [["i = U/R", "10/20", "0,5 A"]]),
      questions: [
        {
          prompt: "Qual corrente passa pela lâmpada?",
          alternatives: optionSet("0,5 A", "2 A", "10 A", "20 A", "200 A", 0),
          explanation: "Pela Lei de Ohm, i = U/R = 10/20 = 0,5 A."
        }
      ]
    };
  }

  return null;
}

function profileForLanguages(booklet, lesson, key) {
  if (hasAny(key, ["inferencia", "implicito", "ironia", "humor"])) {
    return {
      stimulusTitle: "Texto de apoio",
      stimulusText: "Em uma charge, uma pessoa diz estar 'muito tranquila' enquanto aparece cercada por boletos e notificações. A imagem contradiz a fala da personagem.",
      chart: chart("Pistas de sentido", [
        { label: "fala", value: 30 },
        { label: "imagem", value: 70 },
        { label: "contraste", value: 85 }
      ], "Inferir é perceber um sentido que não aparece dito de forma direta."),
      table: table("Leitura da charge", ["Pista", "Sentido"], [["fala tranquila", "aparente calma"], ["boletos", "pressão financeira"], ["contraste", "humor/ironia"]]),
      questions: [
        {
          prompt: "O humor da charge nasce principalmente de qual recurso?",
          alternatives: optionSet("Da contradição entre a fala da personagem e a situação mostrada na imagem.", "Da repetição de uma regra gramatical no texto verbal.", "Da ausência completa de linguagem não verbal.", "Do uso de dados estatísticos no canto da imagem.", "Da explicação direta do narrador sobre o problema.", 1),
          explanation: "A ironia surge quando a fala afirma tranquilidade, mas a imagem revela uma situação de tensão."
        }
      ]
    };
  }

  if (hasAny(key, ["tese", "argumento", "ponto de vista", "opiniao"])) {
    return {
      stimulusTitle: "Trecho opinativo",
      stimulusText: "O uso consciente das redes sociais deve ser ensinado na escola, pois a circulação de notícias falsas afeta escolhas coletivas e relações democráticas.",
      chart: chart("Estrutura argumentativa", [
        { label: "tese", value: 80 },
        { label: "justificativa", value: 70 },
        { label: "exemplo", value: 45 }
      ], "A tese é a ideia defendida; argumentos sustentam essa ideia."),
      table: table("Elementos do argumento", ["Elemento", "No trecho"], [["tese", "ensinar uso consciente das redes"], ["argumento", "fake news afetam escolhas coletivas"]]),
      questions: [
        {
          prompt: "Qual é a tese defendida no trecho?",
          alternatives: optionSet("A escola deve ensinar o uso consciente das redes sociais.", "As redes sociais devem substituir os livros didáticos.", "Notícias falsas não interferem na vida coletiva.", "A democracia independe da comunicação.", "A escola deve abandonar temas digitais.", 2),
          explanation: "A tese é a posição central defendida: ensinar o uso consciente das redes na escola."
        }
      ]
    };
  }

  if (hasAny(key, ["publico-alvo", "campanha", "cartaz", "anuncio", "publicitario", "multimodal"])) {
    return {
      stimulusTitle: "Campanha institucional",
      stimulusText: "Um cartaz mostra uma torneira pingando ao lado da frase: 'Cada gota conta. Feche antes que falte.' A imagem ocupa quase todo o espaço do cartaz.",
      chart: chart("Componentes do cartaz", [
        { label: "imagem", value: 75 },
        { label: "slogan", value: 60 },
        { label: "chamada à ação", value: 85 }
      ], "Textos multimodais combinam imagem, palavra e intenção comunicativa."),
      table: table("Finalidade comunicativa", ["Recurso", "Efeito"], [["torneira pingando", "visualiza desperdício"], ["slogan", "convoca o leitor"], ["verbo no imperativo", "orienta ação"]]),
      questions: [
        {
          prompt: "Qual é a finalidade principal do cartaz?",
          alternatives: optionSet("Convencer o público a economizar água por meio de alerta visual e verbal.", "Narrar uma história ficcional sobre uma torneira.", "Ensinar a fórmula química da água.", "Vender um produto de limpeza doméstica.", "Apresentar dados completos sobre saneamento.", 3),
          explanation: "A campanha usa imagem e frase de impacto para orientar o comportamento do público."
        }
      ]
    };
  }

  if (hasAny(key, ["poema", "eu lirico", "metafora", "literatura", "memoria", "ancestralidade", "narrador"])) {
    return {
      stimulusTitle: "Trecho literário",
      stimulusText: "Guardo no quintal da memória a voz de minha avó, semente que ainda cresce quando a tarde silencia.",
      chart: chart("Imagens poéticas", [
        { label: "memória", value: 80 },
        { label: "voz", value: 55 },
        { label: "semente", value: 70 }
      ], "A linguagem literária costuma criar imagens simbólicas, não apenas informações diretas."),
      table: table("Leitura literária", ["Imagem", "Possível sentido"], [["quintal da memória", "espaço afetivo"], ["voz da avó", "ancestralidade"], ["semente", "continuidade"]]),
      questions: [
        {
          prompt: "No trecho, a imagem da 'semente' sugere principalmente",
          alternatives: optionSet("a permanência afetiva da memória familiar.", "a descrição técnica de uma planta.", "a rejeição completa do passado.", "um dado estatístico sobre agricultura.", "uma instrução objetiva de cultivo.", 4),
          explanation: "A semente funciona como metáfora de algo que continua vivo na memória do eu lírico."
        }
      ]
    };
  }

  return null;
}

function profileForHumanities(booklet, lesson, key) {
  if (hasAny(key, ["colonizacao", "escravidao", "indigena", "encomienda", "catequese", "america"])) {
    return {
      stimulusTitle: "Fonte histórica",
      stimulusText: "Um documento colonial descreve a imposição de trabalho a povos indígenas, justificando a prática como parte da organização econômica e religiosa do período.",
      chart: chart("Relações coloniais", [
        { label: "exploração", value: 85 },
        { label: "resistência", value: 60 },
        { label: "catequese", value: 55 }
      ], "Fontes históricas devem ser lidas considerando interesses e relações de poder."),
      table: table("Análise da fonte", ["Elemento", "Interpretação"], [["trabalho imposto", "exploração colonial"], ["justificativa religiosa", "dominação cultural"], ["resistência", "ação dos povos submetidos"]]),
      questions: [
        {
          prompt: "A fonte permite compreender a colonização principalmente como processo de",
          alternatives: optionSet("dominação econômica, cultural e política sobre populações originárias.", "cooperação igualitária entre europeus e indígenas.", "ausência de interesses econômicos na América.", "fim imediato das hierarquias sociais.", "neutralidade completa das instituições religiosas.", 1),
          explanation: "A colonização combinou exploração do trabalho, imposição cultural e controle político."
        }
      ]
    };
  }

  if (hasAny(key, ["urbanizacao", "segregacao", "moradia", "cidade", "mobilidade", "saneamento"])) {
    return {
      stimulusTitle: "Espaço urbano",
      stimulusText: "Em uma metrópole, áreas centrais concentram serviços e transporte, enquanto periferias crescem com menor acesso a saneamento e mobilidade.",
      chart: chart("Acesso urbano", [
        { label: "centro", value: 85 },
        { label: "bairro intermediário", value: 55 },
        { label: "periferia", value: 25 }
      ], "A desigualdade urbana aparece na distribuição desigual de infraestrutura."),
      table: table("Segregação socioespacial", ["Área", "Característica"], [["centro", "mais serviços"], ["periferia", "maiores deslocamentos"], ["cidade", "desigualdade territorial"]]),
      questions: [
        {
          prompt: "O fenômeno descrito está mais ligado a qual conceito?",
          alternatives: optionSet("Segregação socioespacial.", "Deriva continental.", "Latitude climática.", "Rotação de culturas.", "Equilíbrio térmico.", 2),
          explanation: "A segregação socioespacial ocorre quando grupos sociais vivem a cidade com acesso desigual a serviços e infraestrutura."
        }
      ]
    };
  }

  if (hasAny(key, ["racismo", "desigualdade", "genero", "feminismo", "direitos humanos", "cidadania", "xenofobia"])) {
    return {
      stimulusTitle: "Texto social",
      stimulusText: "Uma campanha afirma que igualdade formal não basta quando parte da população continua sofrendo barreiras históricas no acesso à escola, trabalho e representação política.",
      chart: chart("Dimensões da desigualdade", [
        { label: "acesso", value: 70 },
        { label: "representação", value: 55 },
        { label: "renda", value: 80 }
      ], "Desigualdades sociais são históricas e aparecem em várias dimensões da vida coletiva."),
      table: table("Leitura sociológica", ["Conceito", "Aplicação"], [["cidadania", "direitos efetivos"], ["desigualdade", "barreiras históricas"], ["representatividade", "presença em espaços de poder"]]),
      questions: [
        {
          prompt: "A campanha defende que a cidadania precisa ser entendida como",
          alternatives: optionSet("garantia real de direitos e enfrentamento de desigualdades históricas.", "apenas existência de leis escritas.", "benefício exclusivo de grupos de maior renda.", "ausência de participação política.", "negação das diferenças sociais.", 3),
          explanation: "Cidadania envolve direitos formais e condições reais para exercê-los."
        }
      ]
    };
  }

  if (hasAny(key, ["platao", "aristoteles", "justica", "contrato social", "rousseau", "etica", "soberania", "republica"])) {
    return {
      stimulusTitle: "Texto filosófico adaptado",
      stimulusText: "Para um pensador político, uma sociedade justa não depende apenas da força das leis, mas da participação dos cidadãos na definição do bem comum.",
      chart: chart("Ideias políticas", [
        { label: "lei", value: 55 },
        { label: "participação", value: 80 },
        { label: "bem comum", value: 75 }
      ], "Em filosofia política, conceitos como justiça, cidadania e legitimidade aparecem conectados."),
      table: table("Conceitos", ["Termo", "Sentido"], [["legitimidade", "aceitação justificada do poder"], ["bem comum", "interesse coletivo"], ["cidadania", "participação e direitos"]]),
      questions: [
        {
          prompt: "O trecho associa justiça política principalmente à",
          alternatives: optionSet("participação cidadã orientada pelo bem comum.", "obediência cega a qualquer governante.", "eliminação de toda vida coletiva.", "negação dos direitos políticos.", "substituição da ética pela força.", 4),
          explanation: "A justiça política é apresentada como construção coletiva ligada ao bem comum."
        }
      ]
    };
  }

  return null;
}

function profileFor(booklet, lesson) {
  const key = simplify(`${booklet.subject} ${booklet.title} ${lesson.title}`);
  const areaProfile = {
    matematica: profileForMath,
    natureza: profileForNature,
    linguagens: profileForLanguages,
    humanas: profileForHumanities
  }[booklet.area];

  const specific = areaProfile ? areaProfile(booklet, lesson, key) : null;
  return { ...baseProfile(booklet, lesson), ...(specific || {}) };
}

function makeStimulus(profile, questionIndex) {
  if (questionIndex === 1) {
    return {
      type: "chart",
      title: profile.chart.title,
      text: profile.stimulusText,
      chart: profile.chart
    };
  }

  if (questionIndex === 2) {
    return {
      type: "table",
      title: profile.table.title,
      text: profile.stimulusText,
      table: profile.table
    };
  }

  return {
    type: "text",
    title: profile.stimulusTitle,
    text: profile.stimulusText
  };
}

function derivedQuestion(profile, booklet, lesson, questionIndex) {
  if (questionIndex === 1 && profile.chart?.data?.length) {
    const data = profile.chart.data;
    const highest = [...data].sort((a, b) => Number(b.value) - Number(a.value))[0];
    const lowest = [...data].sort((a, b) => Number(a.value) - Number(b.value))[0];

    return {
      prompt: `De acordo com o gráfico sobre ${lesson.title}, qual leitura está correta?`,
      alternatives: optionSet(
        `${highest.label} apresenta o maior valor entre as categorias mostradas.`,
        `${lowest.label} apresenta o maior valor entre as categorias mostradas.`,
        "Todas as categorias têm exatamente o mesmo valor.",
        "O gráfico não permite comparar nenhuma categoria.",
        `O gráfico mostra que ${lesson.title} não tem relação com ${booklet.subject}.`,
        questionIndex + lesson.id.length
      ),
      explanation: `A maior barra do gráfico é ${highest.label}, com valor ${highest.value}.`
    };
  }

  if (questionIndex === 2 && profile.table?.rows?.length) {
    const row = profile.table.rows[0];
    const second = profile.table.rows[1] || row;
    const third = profile.table.rows[2] || second;

    return {
      prompt: `No quadro sobre ${lesson.title}, qual associação está correta?`,
      alternatives: optionSet(
        `${row[0]} está associado a ${row[1] || row[2]}.`,
        `${row[0]} está associado a ${third[1] || third[2]}.`,
        `${second[0]} elimina qualquer relação com ${lesson.title}.`,
        `A tabela afirma que ${lesson.title} não possui características próprias.`,
        "Todas as linhas apresentam informações contraditórias entre si.",
        questionIndex + lesson.id.length
      ),
      explanation: `O quadro associa ${row[0]} a ${row[1] || row[2]}, mostrando uma relação direta do assunto.`
    };
  }

  return profile.questions[0];
}

function buildQuestion({ booklet, chapter, lesson, profile, questionIndex }) {
  const source = profile.questions[questionIndex] || derivedQuestion(profile, booklet, lesson, questionIndex);
  const options = optionSet(
    source.alternatives.find((item) => item.correct)?.text || source.alternatives[0].text,
    ...source.alternatives.filter((item) => !item.correct).slice(0, 4).map((item) => item.text),
    questionIndex + lesson.id.length
  );
  const answerIndex = options.findIndex((item) => item.correct);

  return {
    id: `${booklet.id}-${lesson.id}-quiz-${questionIndex + 1}`,
    area: booklet.area,
    areaLabel: booklet.areaLabel || areaConfig[booklet.area]?.label,
    subject: booklet.subject,
    bookletId: booklet.id,
    bookletTitle: booklet.title,
    chapterTitle: chapter.title,
    lessonId: lesson.id,
    topic: lesson.title,
    difficulty: difficultyCycle[questionIndex % difficultyCycle.length],
    skill: `Resolver questão de ${lesson.title} em contexto de ${booklet.subject}.`,
    stimulus: makeStimulus(profile, questionIndex),
    prompt: source.prompt,
    alternatives: options.map((option, index) => ({
      id: String.fromCharCode(65 + index),
      text: option.text
    })),
    answer: String.fromCharCode(65 + answerIndex),
    explanation: source.explanation,
    review: {
      whyCorrect: `A alternativa correta descreve ${lesson.title} de forma compatível com o conceito estudado e com a situação apresentada.`,
      howToAvoidMistake: `Revise ${lesson.title} observando definição, exemplo, relação de causa e consequência e possíveis cálculos ou evidências do tema.`,
      relatedStudyUrl: `ambiente-estudo.html?id=${encodeURIComponent(booklet.id)}`
    },
    tags: [booklet.area, booklet.subject, booklet.title, lesson.title, chapter.title].map(String)
  };
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const lessonIndex = JSON.parse(fs.readFileSync(indexFile, "utf8"));
  const byArea = {};
  const globalIndex = [];

  for (const entry of lessonIndex) {
    const booklet = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
    const questions = [];

    for (const chapter of booklet.chapters) {
      for (const lesson of chapter.lessons) {
        const profile = profileFor(booklet, lesson);
        for (let questionIndex = 0; questionIndex < 3; questionIndex += 1) {
          questions.push(buildQuestion({ booklet, chapter, lesson, profile, questionIndex }));
        }
      }
    }

    if (!byArea[booklet.area]) {
      byArea[booklet.area] = {
        area: booklet.area,
        areaLabel: booklet.areaLabel,
        icon: areaConfig[booklet.area]?.icon || "book-open",
        questions: []
      };
    }

    byArea[booklet.area].questions.push(...questions);
    globalIndex.push({
      bookletId: booklet.id,
      title: booklet.title,
      subject: booklet.subject,
      area: booklet.area,
      areaLabel: booklet.areaLabel,
      questions: questions.length,
      file: `data/quiz/quiz-${booklet.area}.json`
    });
  }

  for (const area of Object.values(byArea)) {
    fs.writeFileSync(path.join(outputDir, `quiz-${area.area}.json`), `${JSON.stringify(area, null, 2)}\n`, "utf8");
  }

  const summary = Object.values(byArea).map((area) => ({
    area: area.area,
    areaLabel: area.areaLabel,
    file: `data/quiz/quiz-${area.area}.json`,
    questions: area.questions.length
  }));

  fs.writeFileSync(path.join(outputDir, "quiz-index.json"), `${JSON.stringify({ summary, booklets: globalIndex }, null, 2)}\n`, "utf8");
  console.log(`Generated ${summary.reduce((sum, item) => sum + item.questions, 0)} questions.`);
}

main();
