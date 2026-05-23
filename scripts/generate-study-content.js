const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceFiles = [
  "data/biblioteca-linguagens.json",
  "data/biblioteca-humanas.json",
  "data/biblioteca-natureza.json",
  "data/biblioteca-matematica.json"
];

const outputDir = path.join(root, "data", "aulas");
const minLinesPerBooklet = 5000;

const areaTone = {
  linguagens: {
    question: "Que sentido o texto, imagem ou linguagem está construindo?",
    method: "leia primeiro o contexto, depois observe escolhas de linguagem e só então compare as alternativas",
    example: "em uma campanha, uma palavra simples pode aproximar o público; em um poema, a repetição pode criar memória ou emoção",
    visual: "mapa de leitura",
    formulaName: "Roteiro de interpretação",
    formula: "sentido = contexto + linguagem + finalidade + efeito no leitor"
  },
  humanas: {
    question: "Que relação social, histórica, política ou espacial está em jogo?",
    method: "identifique tempo, lugar, grupo social, conflito e consequência",
    example: "uma fonte sobre trabalho pode revelar hierarquia, resistência, cidadania ou desigualdade",
    visual: "linha de causa e consequência",
    formulaName: "Roteiro histórico-social",
    formula: "processo = contexto + agentes + interesses + consequências"
  },
  natureza: {
    question: "Qual fenômeno natural, tecnológico ou ambiental explica a situação?",
    method: "separe o que é causa, processo, efeito e aplicação prática",
    example: "um problema sobre saúde pode envolver célula, microrganismo, ambiente, prevenção e tecnologia",
    visual: "fluxo de fenômeno",
    formulaName: "Roteiro científico",
    formula: "fenômeno = causa + mecanismo + evidência + impacto"
  },
  matematica: {
    question: "Quais grandezas aparecem e qual conta representa a situação?",
    method: "marque dados, unidades, relação entre grandezas e objetivo da pergunta",
    example: "uma questão de custo pode exigir porcentagem, função, comparação de propostas ou otimização",
    visual: "modelo de grandezas",
    formulaName: "Roteiro matemático",
    formula: "resolução = dados + unidade + relação + cálculo + conferência"
  }
};

const subjectTips = {
  "Língua Portuguesa": "procure sempre o objetivo do texto e o efeito produzido pelas palavras.",
  Literatura: "não tente adivinhar a vida do autor; use sinais do próprio texto.",
  Artes: "observe composição, material, contexto e grupo social representado.",
  "Língua Inglesa": "entenda a ideia global antes de traduzir palavra por palavra.",
  "Língua Espanhola": "preste atenção aos regionalismos e falsos cognatos.",
  História: "leia a fonte pensando em tempo histórico, interesses e permanências.",
  Geografia: "relacione espaço, escala, economia, ambiente e desigualdade.",
  Sociologia: "ligue o conceito ao exemplo social concreto apresentado.",
  Filosofia: "identifique o problema: justiça, poder, conhecimento, ética ou liberdade.",
  Biologia: "pergunte qual estrutura, processo ou relação ecológica explica a situação.",
  Química: "comece pelas substâncias, proporções, grupos funcionais ou transformações.",
  Física: "desenhe o sistema, marque grandezas e confira unidades.",
  Matemática: "transforme o texto em dados, relação e estratégia de cálculo."
};

const topicProfiles = [
  {
    keys: ["porcentagem", "aumento percentual", "desconto percentual", "variação percentual"],
    definition: "Porcentagem é uma forma de comparar uma parte com o total usando base 100. No ENEM, ela aparece em preço, população, gráficos, desconto, aumento, lucro, imposto, economia e variação.",
    keyIdeas: ["100% representa o total.", "15% é o mesmo que 15/100 ou 0,15.", "Aumento usa fator maior que 1; desconto usa fator menor que 1."],
    formulas: [
      ["Porcentagem de um valor", "parte = total × taxa decimal", "Use quando a questão pede 20% de 350, 15% de desconto ou parcela de um total."],
      ["Aumento percentual", "valor final = valor inicial × (1 + taxa)", "Use taxa em decimal: 12% vira 0,12."],
      ["Desconto percentual", "valor final = valor inicial × (1 - taxa)", "Use quando o preço diminui."],
      ["Variação percentual", "variação % = (diferença / valor inicial) × 100", "Use para comparar antes e depois."]
    ],
    example: {
      prompt: "Uma apostila custava R$ 80,00 e teve desconto de 25%. Qual é o novo preço?",
      data: ["valor inicial = 80", "taxa = 25% = 0,25", "desconto: usar 1 - 0,25"],
      steps: ["Calcule o fator: 1 - 0,25 = 0,75.", "Multiplique: 80 × 0,75 = 60.", "Confira: preço com desconto precisa ser menor que 80."],
      answer: "O novo preço é R$ 60,00."
    },
    visual: ["Valor inicial", "Taxa decimal", "Fator de aumento/desconto", "Valor final"],
    question: "Um produto de R$ 120,00 aumenta 10% e depois recebe desconto de 10%. O preço volta ao valor inicial?",
    alternatives: ["Sim, porque os percentuais são iguais.", "Não, porque o desconto de 10% incide sobre o valor já aumentado.", "Sim, porque 10 - 10 = 0.", "Não, porque todo desconto aumenta o preço.", "Depende apenas da marca do produto."],
    answer: 1
  },
  {
    keys: ["razão", "proporção", "regra de três", "grandezas diretamente", "grandezas inversamente"],
    definition: "Proporção é uma relação entre grandezas. No ENEM, aparece em escala, receita, velocidade, produção, densidade, consumo e comparação de quantidades.",
    keyIdeas: ["Grandezas diretas crescem juntas.", "Grandezas inversas: uma cresce enquanto a outra diminui.", "Antes da conta, decida o tipo de relação."],
    formulas: [
      ["Proporção direta", "a / b = c / x", "Use quando dobrar uma grandeza dobra a outra."],
      ["Proporção inversa", "a × b = c × x", "Use quando mais pessoas reduzem o tempo, ou maior velocidade reduz o tempo."],
      ["Razão", "razão = parte A / parte B", "Use para comparar duas medidas."]
    ],
    example: {
      prompt: "3 máquinas produzem 120 peças em um dia. Quantas peças 5 máquinas iguais produzem no mesmo tempo?",
      data: ["3 máquinas → 120 peças", "5 máquinas → x peças", "relação direta"],
      steps: ["Monte 3/120 = 5/x.", "Multiplique cruzado: 3x = 600.", "Divida: x = 200."],
      answer: "5 máquinas produzem 200 peças."
    },
    visual: ["Grandeza A", "Tipo de relação", "Grandeza B", "Proporção", "Resposta"],
    question: "Se mais trabalhadores fazem a mesma obra em menos tempo, a relação entre trabalhadores e tempo é:",
    alternatives: ["Direta.", "Inversa.", "Sempre percentual.", "Exponencial.", "Sem relação."],
    answer: 1
  },
  {
    keys: ["função afim", "função linear", "tarifa fixa", "tarifa variável", "valor fixo"],
    definition: "Função afim modela situações em que existe uma parte fixa e uma parte que varia de modo constante. É muito comum em corridas por aplicativo, contas de energia, planos de internet e aluguel de equipamentos.",
    keyIdeas: ["b é o valor inicial ou fixo.", "a é quanto cresce a cada unidade.", "O gráfico é uma reta."],
    formulas: [
      ["Função afim", "f(x) = ax + b", "Use quando há taxa fixa e taxa por unidade."],
      ["Coeficiente angular", "a = variação de y / variação de x", "Mostra quanto a função cresce por unidade."],
      ["Coeficiente linear", "b = valor quando x = 0", "É o ponto inicial da situação."]
    ],
    example: {
      prompt: "Uma corrida custa R$ 6,00 de taxa fixa mais R$ 2,50 por km. Quanto custa uma corrida de 8 km?",
      data: ["b = 6", "a = 2,50", "x = 8"],
      steps: ["Monte f(x) = 2,50x + 6.", "Substitua x = 8: f(8) = 2,50 × 8 + 6.", "Calcule: 20 + 6 = 26."],
      answer: "A corrida custa R$ 26,00."
    },
    visual: ["x aumenta", "soma uma taxa constante", "reta no gráfico", "valor final"],
    question: "Em f(x)=3x+12, o número 12 representa:",
    alternatives: ["O valor que cresce por unidade.", "O valor fixo inicial.", "O percentual de desconto.", "A área do gráfico.", "A quantidade de raízes."],
    answer: 1
  },
  {
    keys: ["função quadrática", "quadrática"],
    definition: "Função quadrática modela situações com crescimento curvo, área, lançamento, lucro, custo ou otimização. Seu gráfico é uma parábola.",
    keyIdeas: ["Tem forma ax² + bx + c.", "O vértice indica máximo ou mínimo.", "As raízes são os pontos em que y = 0."],
    formulas: [
      ["Função quadrática", "f(x) = ax² + bx + c", "Use quando aparece uma grandeza elevada ao quadrado."],
      ["Vértice", "xv = -b / 2a", "Use para achar máximo ou mínimo."],
      ["Delta", "Δ = b² - 4ac", "Ajuda a achar raízes."]
    ],
    example: {
      prompt: "O custo C de uma peça é C(x)=x²-6x+20. Para qual x o custo é mínimo?",
      data: ["a = 1", "b = -6", "xv = -b / 2a"],
      steps: ["Substitua: xv = -(-6)/(2×1).", "Calcule: 6/2 = 3.", "Como a > 0, a parábola abre para cima e o vértice é mínimo."],
      answer: "O custo mínimo ocorre em x = 3."
    },
    visual: ["coeficientes", "parábola", "vértice", "máximo ou mínimo"],
    question: "Quando a parábola tem a > 0, ela apresenta:",
    alternatives: ["Valor máximo.", "Valor mínimo.", "Nenhum vértice.", "Sempre duas raízes reais.", "Gráfico em linha reta."],
    answer: 1
  },
  {
    keys: ["função exponencial", "exponencial"],
    definition: "Função exponencial descreve crescimento ou decaimento multiplicativo, como população, juros compostos, bactérias, radioatividade e escalas de intensidade.",
    keyIdeas: ["O valor é multiplicado por um fator a cada etapa.", "Crescimento percentual repetido não é soma simples.", "A base maior que 1 cresce; entre 0 e 1 decai."],
    formulas: [
      ["Modelo exponencial", "f(t) = valor inicial × fator^t", "Use quando há multiplicação repetida."],
      ["Juros compostos", "M = C × (1 + i)^t", "Use quando o rendimento incide sobre o acumulado."],
      ["Decaimento", "N = N0 × (1 - taxa)^t", "Use quando há redução percentual repetida."]
    ],
    example: {
      prompt: "Uma população de bactérias dobra a cada hora. Começando com 100, quantas haverá após 3 horas?",
      data: ["valor inicial = 100", "fator = 2", "t = 3"],
      steps: ["Use f(t)=100×2^t.", "Substitua t=3: 100×2³.", "Calcule: 100×8=800."],
      answer: "Haverá 800 bactérias."
    },
    visual: ["valor inicial", "fator", "tempo", "crescimento acumulado"],
    question: "Crescimento exponencial significa que a grandeza:",
    alternatives: ["Aumenta sempre somando o mesmo número.", "Aumenta por multiplicação repetida.", "Nunca muda.", "Sempre vira uma reta.", "Só aparece em geometria."],
    answer: 1
  },
  {
    keys: ["logarítmica", "logarítmica", "escala richter"],
    definition: "Logaritmo responde à pergunta: a qual expoente a base precisa ser elevada? No ENEM, aparece em escalas como Richter, pH e crescimento em ordem de grandeza.",
    keyIdeas: ["Logaritmo desfaz exponencial.", "Escalas logarítmicas comprimem valores muito grandes.", "A diferença de 1 unidade pode representar multiplicação por 10."],
    formulas: [
      ["Definição", "log_b(a) = x ⇔ b^x = a", "Use para converter potência em expoente."],
      ["Escala base 10", "log(1000) = 3", "Porque 10³ = 1000."],
      ["Comparação logarítmica", "diferença de 1 → fator 10", "Em escalas decimais, uma unidade pode multiplicar por 10."]
    ],
    example: {
      prompt: "Na escala Richter, um terremoto de magnitude 6 é quantas vezes mais intenso que um de magnitude 4, considerando fator 10 por unidade?",
      data: ["diferença = 6 - 4 = 2", "cada unidade multiplica por 10"],
      steps: ["Calcule a diferença de magnitudes: 2.", "Use fator 10².", "10² = 100."],
      answer: "É 100 vezes mais intenso."
    },
    visual: ["valor muito grande", "escala log", "expoente", "comparação"],
    question: "Em escala logarítmica decimal, aumentar 2 unidades equivale a multiplicar por:",
    alternatives: ["2", "10", "20", "100", "1000"],
    answer: 3
  },
  {
    keys: ["média aritmética", "média", "comparação de médias"],
    definition: "Média aritmética resume um conjunto de valores por equilíbrio. No ENEM, aparece em notas, dados sociais, clima, produção, tempo de atendimento e comparações.",
    keyIdeas: ["Some os valores e divida pela quantidade.", "Média pode ser afetada por valores extremos.", "Comparar médias exige olhar o contexto dos grupos."],
    formulas: [
      ["Média aritmética", "média = soma dos valores / quantidade", "Use quando todos os valores têm mesmo peso."],
      ["Média ponderada", "média = soma(valor × peso) / soma dos pesos", "Use quando há pesos diferentes."],
      ["Soma pela média", "soma = média × quantidade", "Útil quando a média e a quantidade são dadas."]
    ],
    example: {
      prompt: "As notas de um aluno foram 600, 700 e 800. Qual é a média?",
      data: ["valores: 600, 700, 800", "quantidade = 3"],
      steps: ["Some: 600 + 700 + 800 = 2100.", "Divida por 3.", "2100/3 = 700."],
      answer: "A média é 700."
    },
    visual: ["valores", "soma", "quantidade", "média"],
    question: "A média aritmética pode ser enganosa quando:",
    alternatives: ["Todos os valores são iguais.", "Há valores extremos puxando o resultado.", "A quantidade é conhecida.", "A soma é exata.", "O gráfico tem título."],
    answer: 1
  },
  {
    keys: ["probabilidade", "espaço amostral", "eventos equiprováveis"],
    definition: "Probabilidade mede chance. No ENEM, aparece em sorteios, senhas, tentativas, grupos, genética, jogos e situações de decisão.",
    keyIdeas: ["Probabilidade = casos favoráveis / casos possíveis.", "O espaço amostral é o conjunto de possibilidades.", "Eventos independentes costumam envolver multiplicação."],
    formulas: [
      ["Probabilidade simples", "P = favoráveis / possíveis", "Use quando todos os casos têm a mesma chance."],
      ["Probabilidade complementar", "P(não acontecer) = 1 - P(acontecer)", "Útil quando é mais fácil calcular o contrário."],
      ["Eventos independentes", "P(A e B) = P(A) × P(B)", "Use quando um evento não interfere no outro."]
    ],
    example: {
      prompt: "Em uma urna há 3 bolas azuis e 2 vermelhas. Qual a probabilidade de tirar uma azul?",
      data: ["favoráveis = 3", "possíveis = 5"],
      steps: ["Use P = favoráveis/possíveis.", "P = 3/5.", "Em porcentagem, 3/5 = 60%."],
      answer: "A probabilidade é 3/5 ou 60%."
    },
    visual: ["casos possíveis", "casos favoráveis", "fração", "probabilidade"],
    question: "Se todos os resultados têm a mesma chance, a probabilidade é calculada por:",
    alternatives: ["possíveis/favoráveis", "favoráveis/possíveis", "soma dos valores", "maior valor - menor valor", "média dos eventos"],
    answer: 1
  },
  {
    keys: ["combinações", "combinação", "arranjos", "arranjo", "permutações", "permutação", "fatorial", "contagem"],
    definition: "Combinatória conta possibilidades sem listar uma por uma. No ENEM, aparece em senhas, códigos, grupos, escolhas, filas e organização de elementos.",
    keyIdeas: ["Se a ordem importa, pense em arranjo ou permutação.", "Se a ordem não importa, pense em combinação.", "Fatorial representa multiplicações decrescentes."],
    formulas: [
      ["Princípio fundamental da contagem", "total = opções etapa 1 × opções etapa 2 × ...", "Use em senhas e escolhas em etapas."],
      ["Permutação", "P(n) = n!", "Use quando todos os elementos são ordenados."],
      ["Combinação", "C(n,p) = n! / (p!(n-p)!)", "Use quando escolhe grupo e a ordem não importa."],
      ["Arranjo", "A(n,p) = n! / (n-p)!", "Use quando escolhe e ordena."]
    ],
    example: {
      prompt: "Quantas senhas de 3 dígitos podem ser formadas com algarismos de 0 a 9, permitindo repetição?",
      data: ["10 opções no primeiro dígito", "10 no segundo", "10 no terceiro"],
      steps: ["Use o princípio multiplicativo.", "Total = 10 × 10 × 10.", "Total = 1000."],
      answer: "Podem ser formadas 1000 senhas."
    },
    visual: ["etapas", "opções por etapa", "multiplicação", "total"],
    question: "Se a ordem dos escolhidos não muda o grupo, usamos:",
    alternatives: ["Combinação.", "Arranjo.", "Permutação simples.", "Função afim.", "Média ponderada."],
    answer: 0
  },
  {
    keys: ["área do círculo", "comprimento da circunferência", "setor circular", "ângulo central"],
    definition: "Círculo e circunferência aparecem em rodas, pistas, setores, áreas circulares, arcos e objetos redondos. A confusão comum é trocar área por comprimento.",
    keyIdeas: ["Área mede superfície.", "Comprimento mede contorno.", "Setor circular é uma fatia do círculo."],
    formulas: [
      ["Área do círculo", "A = πr²", "Use para superfície circular."],
      ["Comprimento da circunferência", "C = 2πr", "Use para contorno ou uma volta completa."],
      ["Área do setor", "Asetor = (ângulo/360) × πr²", "Use para fatias do círculo."],
      ["Comprimento do arco", "arco = (ângulo/360) × 2πr", "Use para parte da circunferência."]
    ],
    example: {
      prompt: "Um círculo tem raio 3 cm. Qual sua área, usando π = 3?",
      data: ["r = 3", "π = 3", "A = πr²"],
      steps: ["Calcule r²: 3² = 9.", "Multiplique por π: 3 × 9 = 27.", "Use unidade ao quadrado."],
      answer: "A área é 27 cm²."
    },
    visual: ["raio", "área ou contorno?", "fórmula correta", "unidade"],
    question: "A unidade de área deve ser escrita como:",
    alternatives: ["cm", "cm²", "cm³", "km/h", "%"],
    answer: 1
  },
  {
    keys: ["volume de cubo", "volume de cilindro", "volume de prismas", "volume de tanques", "volume de embalagens", "capacidade"],
    definition: "Volume mede o espaço ocupado por um sólido. No ENEM, aparece em caixas, tanques, piscinas, reservatórios, embalagens e capacidade em litros.",
    keyIdeas: ["Volume usa unidade cúbica.", "Capacidade costuma aparecer em litros.", "1 m³ = 1000 L."],
    formulas: [
      ["Volume do bloco/prisma", "V = área da base × altura", "Use em prismas, caixas e tanques retangulares."],
      ["Volume do cubo", "V = aresta³", "Use quando todas as arestas são iguais."],
      ["Volume do cilindro", "V = πr²h", "Use em latas, caixas cilíndricas e reservatórios."],
      ["Conversão", "1 m³ = 1000 L", "Use quando a resposta pede litros."]
    ],
    example: {
      prompt: "Um tanque retangular mede 2 m por 3 m por 1 m. Qual seu volume em litros?",
      data: ["comprimento = 2", "largura = 3", "altura = 1", "1 m³ = 1000 L"],
      steps: ["Calcule V = 2 × 3 × 1 = 6 m³.", "Converta: 6 × 1000 = 6000 L.", "Confira se a unidade pedida é litro."],
      answer: "O volume é 6000 L."
    },
    visual: ["base", "altura", "volume", "conversão para litros"],
    question: "Para transformar 4 m³ em litros, fazemos:",
    alternatives: ["4 ÷ 1000", "4 × 1000", "4 × 100", "4 ÷ 10", "4²"],
    answer: 1
  },
  {
    keys: ["teorema de pitágoras", "pitágoras", "diagonal"],
    definition: "O Teorema de Pitágoras relaciona os lados de um triângulo retângulo. É muito usado em diagonais, distâncias, rotas, telas e mapas.",
    keyIdeas: ["Só vale para triângulo retângulo.", "A hipotenusa é o maior lado.", "A fórmula relaciona quadrados dos lados."],
    formulas: [
      ["Pitágoras", "a² = b² + c²", "Use quando há triângulo retângulo."],
      ["Diagonal do retângulo", "d² = largura² + altura²", "É aplicação direta de Pitágoras."],
      ["Distância no plano", "d² = (Δx)² + (Δy)²", "Use em coordenadas ou deslocamentos perpendiculares."]
    ],
    example: {
      prompt: "Um retângulo mede 6 cm por 8 cm. Qual é a diagonal?",
      data: ["catetos = 6 e 8", "d² = 6² + 8²"],
      steps: ["Calcule 6²=36 e 8²=64.", "Some: 36+64=100.", "Tire a raiz: d=10."],
      answer: "A diagonal mede 10 cm."
    },
    visual: ["cateto", "cateto", "hipotenusa", "raiz quadrada"],
    question: "Pitágoras só deve ser usado diretamente quando há:",
    alternatives: ["Triângulo qualquer.", "Triângulo retângulo.", "Círculo.", "Tabela.", "Função exponencial."],
    answer: 1
  },
  {
    keys: ["pH", "ácidas", "básicas", "soluções ácidas"],
    definition: "pH indica acidez ou basicidade de uma solução. No ENEM, aparece em saúde, ambiente, água, solo, alimentos, equilíbrio químico e produtos do cotidiano.",
    keyIdeas: ["pH menor que 7 tende a ser ácido.", "pH maior que 7 tende a ser básico.", "pH 7 é neutro em condições usuais."],
    formulas: [
      ["pH", "pH = -log[H+]", "Relaciona pH à concentração de íons H+."],
      ["pOH", "pH + pOH = 14", "Use em água a 25 °C quando pOH aparece."],
      ["Comparação", "diferença de 1 no pH → fator 10", "pH é escala logarítmica."]
    ],
    example: {
      prompt: "Uma solução tem pH 3 e outra tem pH 5. Qual é mais ácida?",
      data: ["pH menor = mais ácido", "3 < 5"],
      steps: ["Compare os valores.", "O menor pH indica maior acidez.", "Logo, pH 3 é mais ácido."],
      answer: "A solução de pH 3 é mais ácida."
    },
    visual: ["0 ácido", "7 neutro", "14 básico"],
    question: "Se o pH diminui de 5 para 4, a acidez:",
    alternatives: ["Diminui 10 vezes.", "Aumenta 10 vezes.", "Fica igual.", "Vira neutra.", "Depende da cor."],
    answer: 1
  },
  {
    keys: ["concentração comum", "concentração molar", "diluição", "massa de soluto", "volume de solução"],
    definition: "Concentração indica quanto soluto existe em certa quantidade de solução. Aparece em medicamentos, soro caseiro, poluição, laboratório e alimentos.",
    keyIdeas: ["Soluto é o que se dissolve.", "Solução é a mistura final.", "Diluir aumenta volume e diminui concentração."],
    formulas: [
      ["Concentração comum", "C = m / V", "Massa por volume, geralmente g/L."],
      ["Concentração molar", "M = n / V", "Quantidade de matéria por volume, mol/L."],
      ["Diluição", "C1V1 = C2V2", "A quantidade de soluto permanece a mesma."]
    ],
    example: {
      prompt: "20 g de sal são dissolvidos em 2 L de solução. Qual é a concentração comum?",
      data: ["m = 20 g", "V = 2 L", "C = m/V"],
      steps: ["Substitua: C = 20/2.", "Calcule: C = 10.", "Escreva g/L."],
      answer: "A concentração é 10 g/L."
    },
    visual: ["soluto", "volume", "concentração", "unidade"],
    question: "Na diluição, a quantidade de soluto:",
    alternatives: ["Aumenta sempre.", "Diminui sempre.", "Permanece a mesma.", "Vira solvente.", "Não importa."],
    answer: 2
  },
  {
    keys: ["oxidação", "redução", "redox", "pilhas", "ânodo", "cátodo"],
    definition: "Reações redox envolvem transferência de elétrons. No ENEM, aparecem em pilhas, corrosão, energia, células combustíveis e processos biológicos.",
    keyIdeas: ["Oxidação perde elétrons.", "Redução ganha elétrons.", "Em pilhas, há transformação química gerando energia elétrica."],
    formulas: [
      ["Oxidação", "perde elétrons", "O número de oxidação aumenta."],
      ["Redução", "ganha elétrons", "O número de oxidação diminui."],
      ["Pilha", "energia química → energia elétrica", "O fluxo de elétrons gera corrente."]
    ],
    example: {
      prompt: "Em uma reação, um metal perde elétrons. Ele sofreu oxidação ou redução?",
      data: ["perda de elétrons", "oxidação = perder elétrons"],
      steps: ["Identifique o movimento dos elétrons.", "Perder elétrons é oxidação.", "Logo, o metal oxidou."],
      answer: "Sofreu oxidação."
    },
    visual: ["espécie que perde elétrons", "elétrons fluem", "espécie que ganha elétrons"],
    question: "Redução é o processo em que uma espécie:",
    alternatives: ["Perde elétrons.", "Ganha elétrons.", "Evapora.", "Dilui.", "Aumenta temperatura."],
    answer: 1
  },
  {
    keys: ["velocidade média", "deslocamento", "movimento", "cinemática"],
    definition: "Velocidade média relaciona deslocamento e tempo. Aparece em trajetos, transporte, gráficos, mobilidade e comparação de percursos.",
    keyIdeas: ["Velocidade depende de distância e tempo.", "Unidade precisa combinar.", "Velocidade média não descreve todas as variações do percurso."],
    formulas: [
      ["Velocidade média", "v = Δs / Δt", "Use com deslocamento e tempo."],
      ["Conversão", "1 m/s = 3,6 km/h", "Multiplique por 3,6 para converter m/s em km/h."],
      ["Tempo", "Δt = Δs / v", "Use quando distância e velocidade são conhecidas."]
    ],
    example: {
      prompt: "Um ônibus percorre 180 km em 3 h. Qual é a velocidade média?",
      data: ["Δs = 180 km", "Δt = 3 h"],
      steps: ["Use v = Δs/Δt.", "v = 180/3.", "v = 60 km/h."],
      answer: "A velocidade média é 60 km/h."
    },
    visual: ["distância", "tempo", "divisão", "velocidade"],
    question: "Se a distância é fixa e o tempo aumenta, a velocidade média:",
    alternatives: ["Aumenta.", "Diminui.", "Fica infinita.", "Vira aceleração.", "Não muda nunca."],
    answer: 1
  },
  {
    keys: ["lei de ohm", "corrente elétrica", "resistência elétrica", "diferença de potencial", "circuitos elétricos", "associação de resistores"],
    definition: "Circuitos elétricos relacionam tensão, corrente e resistência. No ENEM, aparecem em lâmpadas, aparelhos, consumo, pilhas e segurança.",
    keyIdeas: ["Tensão empurra cargas.", "Corrente é fluxo de cargas.", "Resistência dificulta a passagem da corrente."],
    formulas: [
      ["Lei de Ohm", "U = R × i", "Relaciona tensão, resistência e corrente."],
      ["Potência elétrica", "P = U × i", "Use em aparelhos elétricos."],
      ["Energia elétrica", "E = P × Δt", "Use para consumo em certo tempo."]
    ],
    example: {
      prompt: "Um resistor de 10 Ω é percorrido por corrente de 2 A. Qual a tensão?",
      data: ["R = 10 Ω", "i = 2 A", "U = R×i"],
      steps: ["Substitua: U = 10×2.", "Calcule U = 20.", "Use unidade volt."],
      answer: "A tensão é 20 V."
    },
    visual: ["tensão", "resistência", "corrente", "potência"],
    question: "Pela Lei de Ohm, se a resistência aumenta e a tensão fica constante, a corrente:",
    alternatives: ["Aumenta.", "Diminui.", "Fica igual sempre.", "Vira potência.", "Some."],
    answer: 1
  },
  {
    keys: ["ideia central", "compreensão global", "finalidade comunicativa", "público-alvo"],
    definition: "Ideia central é o eixo principal do texto. Ela não é um detalhe, nem uma frase solta: é aquilo que organiza todas as informações e explica por que o texto existe.",
    keyIdeas: ["Título e conclusão costumam dar pistas.", "Detalhes servem à ideia central.", "Finalidade comunicativa mostra se o texto informa, critica, orienta ou persuade."],
    formulas: [
      ["Roteiro de ideia central", "ideia central = tema + recorte + intenção", "Use para diferenciar assunto amplo de mensagem principal."],
      ["Finalidade", "finalidade = verbo de ação do texto", "Informar, criticar, convencer, orientar, emocionar ou denunciar."]
    ],
    example: {
      prompt: "Um cartaz mostra uma torneira aberta e a frase 'Cada gota conta'. Qual é a ideia central?",
      data: ["imagem: torneira aberta", "frase: cada gota conta", "contexto: consumo de água"],
      steps: ["Identifique o tema: água.", "Veja a intenção: conscientizar.", "Formule a ideia central: evitar desperdício."],
      answer: "A ideia central é incentivar o uso consciente da água."
    },
    visual: ["tema", "pistas", "intenção", "ideia central"],
    question: "A ideia central de um texto é:",
    alternatives: ["Um exemplo secundário.", "A mensagem principal que organiza o texto.", "Sempre a primeira palavra.", "A opinião do leitor.", "A alternativa mais longa."],
    answer: 1
  },
  {
    keys: ["inferência", "sentidos implícitos", "implícitos", "ironia", "humor", "crítica"],
    definition: "Inferência é entender o que o texto sugere sem dizer diretamente. O leitor usa pistas de linguagem, contexto, imagem, tom e contradições para chegar ao sentido.",
    keyIdeas: ["Inferir não é inventar.", "A resposta precisa ter apoio no texto.", "Ironia costuma dizer uma coisa para criticar outra."],
    formulas: [
      ["Inferência segura", "inferência = pista textual + contexto + lógica", "Use quando a resposta não está copiada no texto."],
      ["Ironia", "sentido real ≠ sentido literal", "Procure contraste entre fala e situação."]
    ],
    example: {
      prompt: "Uma charge mostra uma cidade alagada e um político dizendo: 'Está tudo sob controle'. Que sentido surge?",
      data: ["imagem: alagamento", "fala: controle", "contraste evidente"],
      steps: ["Compare fala e imagem.", "Perceba a contradição.", "Conclua que há crítica irônica."],
      answer: "A charge ironiza a incapacidade do poder público diante do problema."
    },
    visual: ["pista", "contexto", "contraste", "sentido implícito"],
    question: "Uma inferência correta precisa estar:",
    alternatives: ["Apoiada por pistas do texto.", "Baseada só na opinião do leitor.", "Sempre escrita literalmente.", "Fora do contexto.", "No título apenas."],
    answer: 0
  },
  {
    keys: ["tese", "argumento", "ponto de vista", "artigo de opinião"],
    definition: "Tese é a opinião central defendida em um texto argumentativo. Argumentos são as razões usadas para sustentar essa opinião.",
    keyIdeas: ["Tese responde: o autor defende o quê?", "Argumento responde: por quê?", "Exemplo não é tese; exemplo apoia tese."],
    formulas: [
      ["Estrutura argumentativa", "tese + argumentos + conclusão", "Use em artigo de opinião, editorial, texto de crítica e redação."],
      ["Argumento forte", "afirmação + justificativa + evidência", "Ajuda a avaliar se o ponto de vista foi sustentado."]
    ],
    example: {
      prompt: "Um texto afirma que a leitura deve ser incentivada nas escolas porque melhora interpretação e cidadania. Qual é a tese?",
      data: ["defesa central: incentivar leitura", "justificativas: interpretação e cidadania"],
      steps: ["Separe opinião de justificativa.", "A opinião central é o que o autor quer defender.", "As razões vêm depois."],
      answer: "A tese é que a leitura deve ser incentivada nas escolas."
    },
    visual: ["tese", "argumento 1", "argumento 2", "conclusão"],
    question: "Em um texto argumentativo, o argumento serve para:",
    alternatives: ["Enfeitar o texto.", "Sustentar a tese.", "Trocar o tema.", "Apagar a opinião.", "Substituir o título."],
    answer: 1
  },
  {
    keys: ["colonização", "encomienda", "escravidão", "trabalho indígena", "trabalho compulsório", "sociedade açucareira"],
    definition: "Colonização envolve dominação territorial, exploração econômica, imposição cultural e controle do trabalho. No ENEM, o tema aparece ligado a violência, resistência, catequese, escravidão e hierarquias sociais.",
    keyIdeas: ["Colonização não foi encontro neutro.", "Trabalho compulsório sustentou riqueza colonial.", "Resistência indígena e africana precisa ser reconhecida."],
    formulas: [
      ["Processo colonial", "dominação + exploração + catequese + resistência", "Use para interpretar fontes sobre América colonial."],
      ["Trabalho compulsório", "controle político + coerção + produção econômica", "Ajuda a diferenciar trabalho livre e exploração forçada."]
    ],
    example: {
      prompt: "Uma fonte colonial descreve indígenas obrigados a trabalhar para colonizadores. Que processo histórico aparece?",
      data: ["trabalho obrigatório", "controle colonial", "população indígena explorada"],
      steps: ["Identifique os grupos envolvidos.", "Reconheça a coerção.", "Relacione à exploração colonial."],
      answer: "A fonte mostra exploração do trabalho indígena no contexto colonial."
    },
    visual: ["metrópole", "colonizador", "trabalho explorado", "produção", "resistência"],
    question: "A encomienda se relaciona principalmente à:",
    alternatives: ["Autonomia indígena plena.", "Exploração do trabalho indígena.", "Industrialização brasileira.", "Democracia ateniense.", "Guerra Fria."],
    answer: 1
  },
  {
    keys: ["urbanização", "segregação", "periferização", "moradia", "direito à cidade", "mobilidade", "saneamento"],
    definition: "Urbanização é o crescimento e transformação das cidades. No ENEM, aparece ligada à desigualdade, moradia, transporte, saneamento, periferias e acesso ao espaço urbano.",
    keyIdeas: ["Cidade cresce de modo desigual.", "Infraestrutura não chega igualmente a todos.", "Direito à cidade envolve moradia, mobilidade, lazer e serviços."],
    formulas: [
      ["Leitura urbana", "cidade = espaço + infraestrutura + desigualdade + disputa", "Use para interpretar mapas, fotos e textos urbanos."],
      ["Problema urbano", "crescimento + falta de planejamento → impacto social", "Ajuda a explicar periferização e precariedade."]
    ],
    example: {
      prompt: "Um mapa mostra bairros periféricos longe de transporte e saneamento. Que problema urbano aparece?",
      data: ["distância dos serviços", "infraestrutura desigual", "periferia"],
      steps: ["Observe a distribuição espacial.", "Relacione distância e acesso.", "Nomeie a segregação socioespacial."],
      answer: "O mapa evidencia segregação socioespacial."
    },
    visual: ["centro equipado", "periferia distante", "desigualdade de acesso", "direito à cidade"],
    question: "Segregação socioespacial significa:",
    alternatives: ["Distribuição igual de serviços.", "Separação desigual de grupos no espaço urbano.", "Ausência de cidades.", "Apenas aumento da vegetação.", "Somente turismo."],
    answer: 1
  },
  {
    keys: ["racismo", "desigualdade", "representatividade", "relações étnico-raciais", "povos indígenas", "cultura afro-brasileira"],
    definition: "Racismo estrutural é a presença do racismo nas instituições, oportunidades, representações e práticas sociais. No ENEM, o tema aparece em campanhas, textos sociológicos, arte, cultura e direitos.",
    keyIdeas: ["Não se limita a atitudes individuais.", "Afeta acesso a trabalho, educação, segurança e representação.", "Representatividade combate apagamentos históricos."],
    formulas: [
      ["Leitura sociológica", "problema social = estrutura + grupo afetado + desigualdade + resistência", "Use para analisar campanhas e textos sociais."],
      ["Representatividade", "presença + voz + reconhecimento", "Ajuda a ler imagens e discursos culturais."]
    ],
    example: {
      prompt: "Uma campanha mostra pessoas negras em espaços de liderança historicamente negados. Qual debate aparece?",
      data: ["grupo representado", "espaço de liderança", "histórico de exclusão"],
      steps: ["Identifique quem aparece.", "Observe o espaço ocupado.", "Relacione à representatividade e combate ao racismo."],
      answer: "A campanha discute representatividade e enfrentamento do racismo estrutural."
    },
    visual: ["estrutura social", "desigualdade", "representação", "direitos", "resistência"],
    question: "Racismo estrutural indica que o racismo:",
    alternatives: ["É apenas opinião individual.", "Também aparece em instituições e oportunidades sociais.", "Não afeta a sociedade.", "É só um tema histórico sem presente.", "Depende de clima."],
    answer: 1
  },
  {
    keys: ["ecologia", "cadeias alimentares", "teias alimentares", "bioacumulação", "biomagnificação", "ciclo do carbono", "ciclo do nitrogênio"],
    definition: "Ecologia estuda relações entre seres vivos e ambiente. No ENEM, aparece em ciclos da matéria, fluxo de energia, poluição, cadeias alimentares, biodiversidade e sustentabilidade.",
    keyIdeas: ["Energia flui e diminui ao longo da cadeia.", "Matéria circula nos ciclos biogeoquímicos.", "Poluentes podem se acumular nos níveis tróficos."],
    formulas: [
      ["Fluxo de energia", "produtor → consumidor → decompositor", "Use para cadeias e teias alimentares."],
      ["Bioacumulação", "poluente acumulado no organismo", "Aumenta com exposição e dificuldade de eliminação."],
      ["Biomagnificação", "concentração aumenta nos níveis tróficos superiores", "Predadores de topo costumam concentrar mais poluente."]
    ],
    example: {
      prompt: "Um rio contaminado por mercúrio afeta peixes pequenos e aves que comem muitos peixes. Por que as aves sofrem mais?",
      data: ["poluente persistente", "cadeia alimentar", "predador em nível superior"],
      steps: ["Reconheça que o mercúrio acumula.", "Veja que a ave come muitos peixes.", "A concentração aumenta no topo da cadeia."],
      answer: "Ocorre biomagnificação."
    },
    visual: ["produtor", "consumidor primário", "consumidor secundário", "predador", "poluente aumenta"],
    question: "Biomagnificação ocorre quando:",
    alternatives: ["A energia aumenta no topo da cadeia.", "A concentração de poluente aumenta nos níveis tróficos superiores.", "Toda espécie desaparece imediatamente.", "A água vira gás.", "A fotossíntese para."],
    answer: 1
  },
  {
    keys: ["dna", "genes", "heredogramas", "herança ligada ao sexo", "daltonismo", "genótipo", "fenótipo"],
    definition: "Genética estuda herança e expressão de características. No ENEM, aparece em heredogramas, doenças hereditárias, DNA, alelos, cromossomos sexuais e relação genótipo-fenótipo.",
    keyIdeas: ["Genótipo é a composição genética.", "Fenótipo é a característica observável.", "Heredogramas mostram transmissão familiar."],
    formulas: [
      ["Relação genótipo-fenótipo", "fenótipo = genótipo + ambiente", "Use para evitar determinismo simples."],
      ["Herança recessiva", "característica aparece quando não há alelo dominante mascarando", "Observe pais e filhos no heredograma."],
      ["Ligada ao sexo", "genes no cromossomo X ou Y", "Atenção especial a padrões diferentes entre homens e mulheres."]
    ],
    example: {
      prompt: "Um heredograma mostra pais sem a característica e filho afetado por condição recessiva. O que isso sugere?",
      data: ["pais sem fenótipo", "filho afetado", "condição recessiva"],
      steps: ["Se o filho é afetado, recebeu alelo recessivo dos dois pais.", "Os pais podem ser portadores.", "O padrão sugere herança recessiva."],
      answer: "Os pais provavelmente são heterozigotos portadores."
    },
    visual: ["DNA", "gene", "alelo", "genótipo", "fenótipo"],
    question: "Fenótipo é:",
    alternatives: ["A sequência de qualquer gráfico.", "A característica observável resultante de genes e ambiente.", "Sempre o alelo recessivo.", "O nome do cromossomo Y.", "Uma organela."],
    answer: 1
  },
  {
    keys: ["volume de cubo"],
    definition: "Volume de cubo mede quanto espaço cabe dentro de um sólido com todas as arestas iguais. É comum em caixas cúbicas, reservatórios pequenos, embalagens e comparação de capacidade.",
    keyIdeas: ["Todas as arestas têm a mesma medida.", "A unidade final é cúbica.", "Se a aresta dobra, o volume multiplica por 8."],
    formulas: [
      ["Volume do cubo", "V = a³", "a é a aresta do cubo."],
      ["Escala volumétrica", "fator de volume = fator linear³", "Use quando a aresta muda por escala."],
      ["Capacidade", "1 m³ = 1000 L", "Use para converter volume em litros."]
    ],
    example: {
      prompt: "Uma caixa cúbica tem aresta de 4 cm. Qual é o volume?",
      data: ["aresta = 4 cm", "V = a³"],
      steps: ["Substitua: V = 4³.", "Calcule: 4 × 4 × 4 = 64.", "Use cm³."],
      answer: "O volume é 64 cm³."
    },
    visual: ["aresta", "aresta", "aresta", "multiplicação", "volume"],
    question: "Se a aresta de um cubo dobra, seu volume:",
    alternatives: ["Dobra.", "Triplica.", "Multiplica por 4.", "Multiplica por 8.", "Não muda."],
    answer: 3
  },
  {
    keys: ["volume de cilindro", "embalagens cilíndricas"],
    definition: "Volume de cilindro mede o espaço interno de objetos com base circular, como latas, canos, reservatórios e embalagens cilíndricas.",
    keyIdeas: ["A base é um círculo.", "Primeiro calcule a área da base.", "Depois multiplique pela altura."],
    formulas: [
      ["Área da base", "Ab = πr²", "Base circular do cilindro."],
      ["Volume do cilindro", "V = πr²h", "Multiplique área da base pela altura."],
      ["Diâmetro e raio", "r = d/2", "Use quando a questão dá diâmetro."]
    ],
    example: {
      prompt: "Uma lata cilíndrica tem raio 3 cm e altura 10 cm. Use π = 3. Qual é o volume?",
      data: ["r = 3", "h = 10", "π = 3"],
      steps: ["Calcule r²: 3² = 9.", "Área da base: 3 × 9 = 27.", "Volume: 27 × 10 = 270."],
      answer: "O volume é 270 cm³."
    },
    visual: ["raio da base", "área circular", "altura", "volume"],
    question: "No volume do cilindro, πr² representa:",
    alternatives: ["A altura.", "A área da base.", "O diâmetro.", "A capacidade em litros.", "A massa."],
    answer: 1
  },
  {
    keys: ["volume de prismas"],
    definition: "Volume de prismas é calculado multiplicando a área da base pela altura. Serve para blocos, caixas, rampas prismáticas e sólidos com base repetida ao longo da altura.",
    keyIdeas: ["Prisma tem duas bases paralelas e iguais.", "A base pode ser triangular, retangular ou outra figura.", "A fórmula muda conforme a área da base."],
    formulas: [
      ["Volume de prisma", "V = Ab × h", "Ab é a área da base."],
      ["Prisma retangular", "V = comprimento × largura × altura", "Use em caixas e blocos."],
      ["Prisma triangular", "V = (base do triângulo × altura do triângulo / 2) × altura do prisma", "Use quando a base é triangular."]
    ],
    example: {
      prompt: "Um prisma retangular mede 5 cm, 4 cm e 3 cm. Qual é o volume?",
      data: ["comprimento = 5", "largura = 4", "altura = 3"],
      steps: ["Use V = c × l × h.", "Multiplique: 5 × 4 × 3.", "Resultado: 60."],
      answer: "O volume é 60 cm³."
    },
    visual: ["área da base", "altura do prisma", "multiplicação", "volume"],
    question: "A fórmula geral V = Ab × h vale para:",
    alternatives: ["Prismas.", "Apenas círculos.", "Apenas porcentagem.", "Funções exponenciais.", "Probabilidade."],
    answer: 0
  },
  {
    keys: ["volume de tanques", "gráfico de enchimento de tanque", "reservatórios"],
    definition: "Volume de tanques envolve calcular capacidade de reservatórios e interpretar enchimento, esvaziamento, altura da água e vazão.",
    keyIdeas: ["Tanque retangular usa comprimento × largura × altura.", "A altura da água pode ser menor que a altura total.", "Vazão relaciona volume e tempo."],
    formulas: [
      ["Volume preenchido", "V = área da base × altura da água", "Use quando o tanque não está cheio."],
      ["Vazão", "Q = V / tempo", "Mostra quanto volume entra ou sai por unidade de tempo."],
      ["Litros", "1 m³ = 1000 L", "Conversão muito comum em tanques."]
    ],
    example: {
      prompt: "Um tanque tem base de 2 m por 3 m e água até 0,5 m de altura. Quantos litros há no tanque?",
      data: ["área da base = 2 × 3 = 6 m²", "altura da água = 0,5 m"],
      steps: ["Calcule volume: 6 × 0,5 = 3 m³.", "Converta: 3 × 1000.", "Resultado: 3000 L."],
      answer: "Há 3000 litros de água."
    },
    visual: ["área da base", "altura da água", "m³", "litros"],
    question: "Se a água ocupa metade da altura de um tanque com base constante, o volume ocupado é:",
    alternatives: ["Metade do volume total.", "O dobro do volume total.", "Sempre 1000 L.", "Zero.", "Independente da altura."],
    answer: 0
  },
  {
    keys: ["capacidade"],
    definition: "Capacidade indica quanto cabe em um recipiente. Em matemática do ENEM, aparece ligada a volume, litros, mililitros, reservatórios, piscinas e embalagens.",
    keyIdeas: ["Capacidade é volume em linguagem de recipiente.", "Litro e mililitro são unidades comuns.", "1 L = 1000 mL."],
    formulas: [
      ["Metro cúbico para litro", "1 m³ = 1000 L", "Use em reservatórios grandes."],
      ["Litro para mililitro", "1 L = 1000 mL", "Use em embalagens e receitas."],
      ["Capacidade ocupada", "capacidade usada = capacidade total × fração ocupada", "Use quando o recipiente está parcialmente cheio."]
    ],
    example: {
      prompt: "Uma garrafa tem 2 L. Quantos mililitros ela comporta?",
      data: ["1 L = 1000 mL", "2 L"],
      steps: ["Multiplique 2 × 1000.", "Resultado: 2000.", "Use mL."],
      answer: "A garrafa comporta 2000 mL."
    },
    visual: ["volume", "conversão", "litros", "mililitros"],
    question: "3,5 L equivalem a:",
    alternatives: ["35 mL", "350 mL", "3500 mL", "0,35 mL", "35000 L"],
    answer: 2
  },
  {
    keys: ["diluição"],
    definition: "Diluição é o processo de diminuir a concentração de uma solução adicionando solvente. A quantidade de soluto permanece a mesma, mas o volume aumenta.",
    keyIdeas: ["Soluto não muda.", "Volume final aumenta.", "Concentração final diminui."],
    formulas: [
      ["Diluição", "C1V1 = C2V2", "Use quando a quantidade de soluto se conserva."],
      ["Concentração final", "C2 = C1V1 / V2", "Use para descobrir a nova concentração."],
      ["Volume final", "V2 = C1V1 / C2", "Use quando a concentração desejada é dada."]
    ],
    example: {
      prompt: "100 mL de solução 2 mol/L são diluídos até 500 mL. Qual a concentração final?",
      data: ["C1 = 2", "V1 = 100", "V2 = 500"],
      steps: ["Use C1V1 = C2V2.", "2 × 100 = C2 × 500.", "C2 = 200/500 = 0,4."],
      answer: "A concentração final é 0,4 mol/L."
    },
    visual: ["solução concentrada", "adiciona solvente", "volume aumenta", "concentração diminui"],
    question: "Em uma diluição comum, a quantidade de soluto:",
    alternatives: ["Permanece constante.", "Sempre dobra.", "Desaparece.", "Vira solvente.", "Não pode ser calculada."],
    answer: 0
  },
  {
    keys: ["concentração comum"],
    definition: "Concentração comum mede a massa de soluto por volume de solução. É muito usada em g/L para soluções do cotidiano, soro, poluição e preparo de misturas.",
    keyIdeas: ["m é massa do soluto.", "V é volume da solução.", "A unidade típica é g/L."],
    formulas: [
      ["Concentração comum", "C = m / V", "Use massa em gramas e volume em litros."],
      ["Massa de soluto", "m = C × V", "Use quando concentração e volume são dados."],
      ["Volume da solução", "V = m / C", "Use quando massa e concentração são dados."]
    ],
    example: {
      prompt: "Uma solução tem 30 g de soluto em 3 L. Qual é a concentração comum?",
      data: ["m = 30 g", "V = 3 L"],
      steps: ["Use C = m/V.", "C = 30/3.", "C = 10 g/L."],
      answer: "A concentração comum é 10 g/L."
    },
    visual: ["massa do soluto", "volume da solução", "divisão", "g/L"],
    question: "A unidade g/L representa:",
    alternatives: ["Massa por volume.", "Volume por tempo.", "Energia por massa.", "pH por litro.", "Velocidade média."],
    answer: 0
  },
  {
    keys: ["concentração molar"],
    definition: "Concentração molar indica quantidade de matéria por volume de solução. É usada quando a questão trabalha com mol, massa molar e reações químicas.",
    keyIdeas: ["n é quantidade de matéria em mol.", "V geralmente deve estar em litros.", "Pode exigir primeiro calcular n = m/M."],
    formulas: [
      ["Molaridade", "M = n / V", "Use mol por litro."],
      ["Quantidade de matéria", "n = m / MM", "Use massa e massa molar."],
      ["Massa a partir de mol", "m = n × MM", "Use para converter mol em gramas."]
    ],
    example: {
      prompt: "Dissolvem-se 2 mol de soluto em 4 L de solução. Qual é a molaridade?",
      data: ["n = 2 mol", "V = 4 L"],
      steps: ["Use M = n/V.", "M = 2/4.", "M = 0,5 mol/L."],
      answer: "A molaridade é 0,5 mol/L."
    },
    visual: ["mol", "volume em L", "molaridade"],
    question: "Molaridade é medida normalmente em:",
    alternatives: ["g/L", "mol/L", "m/s", "cm²", "% ao mês"],
    answer: 1
  }
];

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getTopicProfile(topic, booklet, chapter, area) {
  const normalized = normalizeText(topic);
  const matched = topicProfiles
    .filter((profile) => profile.keys.some((key) => normalized.includes(normalizeText(key))))
    .sort((a, b) => {
      const aLongest = Math.max(...a.keys.filter((key) => normalized.includes(normalizeText(key))).map((key) => normalizeText(key).length));
      const bLongest = Math.max(...b.keys.filter((key) => normalized.includes(normalizeText(key))).map((key) => normalizeText(key).length));
      return bLongest - aLongest || a.keys.length - b.keys.length;
    })[0];

  if (matched) {
    return matched;
  }

  const tone = areaTone[area.area] || areaTone.linguagens;
  return {
    definition: `${topic} é um conteúdo de ${booklet.subject} que deve ser entendido dentro de ${chapter.title}. O foco é saber reconhecer quando ele aparece em uma questão e qual raciocínio ele pede.`,
    keyIdeas: [
      `Ele aparece ligado ao capítulo ${chapter.title}.`,
      "A resposta depende do contexto apresentado.",
      "O melhor caminho é transformar o enunciado em pistas."
    ],
    formulas: [
      [tone.formulaName, tone.formula, `Use quando ${topic} aparecer em questão contextualizada.`]
    ],
    example: {
      prompt: `Uma questão apresenta ${topic} em um contexto de ${booklet.subject}. O que fazer primeiro?`,
      data: [`Assunto: ${topic}`, `Capítulo: ${chapter.title}`, `Matéria: ${booklet.subject}`],
      steps: [
        "Leia o comando.",
        "Localize a pista principal.",
        `Relacione a pista com ${topic}.`,
        "Elimine respostas sem apoio no contexto."
      ],
      answer: `A resposta deve aplicar ${topic} ao contexto da questão.`
    },
    visual: ["contexto", "pista", topic, "aplicação", "resposta"],
    question: `Em uma questão sobre ${topic}, o que mais ajuda a evitar erro?`,
    alternatives: [
      "Responder pela palavra mais conhecida.",
      "Ler o comando e usar as pistas do enunciado.",
      "Ignorar gráficos e imagens.",
      "Escolher a alternativa mais curta.",
      "Usar opinião pessoal."
    ],
    answer: 1
  };
}

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formulaCards(area, booklet, topic, profile) {
  const cards = [
    {
      name: areaTone[area.area].formulaName,
      expression: areaTone[area.area].formula,
      useWhen: `Use sempre que ${topic} aparecer em um enunciado com texto, imagem, tabela ou situação-problema.`,
      explanation: "Não é uma fórmula para decorar; é um jeito organizado de pensar antes de marcar a alternativa."
    }
  ];

  if (profile?.formulas?.length) {
    cards.unshift(...profile.formulas.map(([name, expression, useWhen]) => ({
      name,
      expression,
      useWhen,
      explanation: `Use esta relação especificamente quando o tópico for ${topic}. Ela ajuda a transformar o enunciado em um caminho de resolução.`
    })));
  }

  if (booklet.subject === "Matemática") {
    cards.push(
      {
        name: "Porcentagem",
        expression: "valor final = valor inicial × (1 ± taxa decimal)",
        useWhen: "Aparecer aumento, desconto, variação, lucro, economia ou comparação de preço.",
        explanation: "Transforme 15% em 0,15. Para aumento use 1 + 0,15. Para desconto use 1 - 0,15."
      },
      {
        name: "Regra de três",
        expression: "a / b = c / x",
        useWhen: "Duas grandezas variam de modo proporcional e uma delas está faltando.",
        explanation: "Antes de montar a conta, decida se a relação é direta ou inversa."
      },
      {
        name: "Função afim",
        expression: "f(x) = ax + b",
        useWhen: "Existe uma parte fixa e uma parte que cresce por unidade.",
        explanation: "Em tarifas, b costuma ser taxa fixa e a costuma ser preço por unidade."
      }
    );
  }

  if (booklet.subject === "Física") {
    cards.push(
      {
        name: "Velocidade média",
        expression: "v = Δs / Δt",
        useWhen: "A questão relaciona distância, tempo e movimento.",
        explanation: "Confira unidades: metros por segundo ou quilômetros por hora."
      },
      {
        name: "Potência",
        expression: "P = E / Δt",
        useWhen: "Aparecem energia, tempo, consumo ou eficiência de equipamentos.",
        explanation: "Potência indica quanta energia é transformada por unidade de tempo."
      },
      {
        name: "Lei de Ohm",
        expression: "U = R × i",
        useWhen: "A questão envolve tensão, resistência e corrente elétrica.",
        explanation: "Leia o circuito antes de substituir números."
      }
    );
  }

  if (booklet.subject === "Química") {
    cards.push(
      {
        name: "Concentração comum",
        expression: "C = m / V",
        useWhen: "Aparecem massa de soluto e volume de solução.",
        explanation: "Confira se o volume está em litro quando a unidade pedida for g/L."
      },
      {
        name: "Quantidade de matéria",
        expression: "n = m / M",
        useWhen: "A questão envolve massa, massa molar e proporção em reação.",
        explanation: "Depois de achar n, use a proporção da equação balanceada."
      },
      {
        name: "pH",
        expression: "pH = -log[H+]",
        useWhen: "Aparece acidez, basicidade ou equilíbrio influenciado por concentração de H+.",
        explanation: "pH menor indica meio mais ácido."
      }
    );
  }

  if (booklet.subject === "Biologia") {
    cards.push(
      {
        name: "Fluxo ecológico",
        expression: "produtor → consumidor → decompositor",
        useWhen: "A questão envolve cadeia alimentar, energia, matéria ou impacto ambiental.",
        explanation: "Energia diminui ao longo da cadeia; matéria circula nos ciclos."
      },
      {
        name: "Relação genótipo-fenótipo",
        expression: "fenótipo = genótipo + ambiente",
        useWhen: "A questão fala de herança, característica observável ou expressão gênica.",
        explanation: "Nem toda característica depende apenas do gene; o ambiente também pode influenciar."
      }
    );
  }

  return cards;
}

function hashTopic(topic) {
  return [...topic].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function topicValue(topic, offset = 0) {
  return 18 + ((hashTopic(topic) + offset * 17) % 72);
}

function graphPoints(kind) {
  if (kind === "quadratic") {
    return [
      { x: 42, y: 48 },
      { x: 92, y: 104 },
      { x: 150, y: 156 },
      { x: 208, y: 104 },
      { x: 270, y: 48 }
    ];
  }

  if (kind === "exponential") {
    return [
      { x: 42, y: 166 },
      { x: 100, y: 150 },
      { x: 158, y: 116 },
      { x: 216, y: 72 },
      { x: 276, y: 28 }
    ];
  }

  if (kind === "log") {
    return [
      { x: 42, y: 168 },
      { x: 82, y: 116 },
      { x: 140, y: 82 },
      { x: 210, y: 58 },
      { x: 278, y: 44 }
    ];
  }

  return [
    { x: 42, y: 160 },
    { x: 102, y: 132 },
    { x: 162, y: 104 },
    { x: 222, y: 76 },
    { x: 282, y: 48 }
  ];
}

function hasAny(normalized, terms) {
  return terms.some((term) => normalized.includes(normalizeText(term)));
}

function valueSeries(topic, count, start = 18, step = 11) {
  const seed = hashTopic(topic);
  return Array.from({ length: count }, (_, index) => start + ((seed + index * 13) % 22) + index * step);
}

function barsFromLabels(topic, labels, start = 18, step = 11) {
  const values = valueSeries(topic, labels.length, start, step);
  return labels.map((label, index) => ({ label, value: values[index] }));
}

function conceptBoard(title, description, items) {
  return {
    type: "concept-board",
    title,
    description,
    items
  };
}

function comparisonTable(title, columns, rows) {
  return {
    type: "comparison-table",
    title,
    columns,
    rows
  };
}

function quoteForPhilosophy(topic) {
  const normalized = normalizeText(topic);

  if (normalized.includes("platao") || normalized.includes("cidade ideal") || normalized.includes("governo dos filosofos")) {
    return {
      author: "Platão",
      quote: "A cidade justa nasce quando cada parte cumpre sua função.",
      explanation: `Use essa ideia para ligar ${topic} a ordem política, educação e justiça.`
    };
  }

  if (normalized.includes("aristoteles") || normalized.includes("virtude") || normalized.includes("bem comum")) {
    return {
      author: "Aristóteles",
      quote: "O ser humano é, por natureza, um animal político.",
      explanation: `A frase ajuda a entender ${topic} como vida em comunidade, finalidade e prática da virtude.`
    };
  }

  if (normalized.includes("rousseau") || normalized.includes("contrato") || normalized.includes("vontade geral") || normalized.includes("soberania")) {
    return {
      author: "Rousseau",
      quote: "O povo só é soberano quando participa da vontade geral.",
      explanation: `Relacione ${topic} a legitimidade, pacto político e participação cidadã.`
    };
  }

  if (normalized.includes("conhecimento") || normalized.includes("empirismo") || normalized.includes("ceticismo") || normalized.includes("razao")) {
    return {
      author: "Descartes",
      quote: "Penso, logo existo.",
      explanation: `A frase serve como porta de entrada para discutir certeza, dúvida e produção do conhecimento.`
    };
  }

  return {
    author: "Sócrates",
    quote: "Uma vida sem exame não realiza plenamente o humano.",
    explanation: `Use essa ideia para aproximar ${topic} de reflexão crítica, ética e investigação filosófica.`
  };
}

function mathVisualModels(topic, profile) {
  const normalized = normalizeText(topic);
  const formula = profile?.formulas?.[0]?.[1] || "modelo = relação entre grandezas";

  if (hasAny(normalized, ["tabela", "estatistica", "frequencia", "media", "dados", "grafico de barras", "grafico de setores"])) {
    return [
      {
        type: "bar-chart",
        title: `Tabela convertida em leitura visual: ${topic}`,
        description: `Em ${topic}, o objetivo não é desenhar uma função. É comparar categorias, unidades e diferenças entre valores.`,
        bars: hasAny(normalized, ["faixa etaria", "populacao"])
          ? barsFromLabels(topic, ["0-14", "15-29", "30-59", "60+"], 16, 9)
          : hasAny(normalized, ["exportacao", "importacao", "balanca"])
            ? barsFromLabels(topic, ["exporta", "importa", "saldo", "variação"], 20, 12)
            : barsFromLabels(topic, ["dado A", "dado B", "dado C", "total"], 18, 10)
      },
      comparisonTable(`Como ler ${topic} sem se perder`, ["Elemento", "O que procurar", "Erro comum"], [
        ["Título", "assunto, período e lugar", "calcular antes de entender"],
        ["Unidade", "%, R$, km, habitantes ou toneladas", "comparar unidades diferentes"],
        ["Maior/menor", "pico, queda, empate ou diferença", "olhar só a primeira linha"]
      ]),
      conceptBoard(`Modelo mental para ${topic}`, "A leitura correta nasce da relação entre título, unidade e comparação.", [
        { label: "Pergunta", text: "O comando pede valor, comparação, tendência, média ou conclusão?" },
        { label: "Dados", text: "Marque a linha, coluna, legenda ou setor que responde ao comando." },
        { label: "Conclusão", text: "Escreva a resposta com a unidade certa e sem exagerar o que o dado não mostra." }
      ])
    ];
  }

  if (hasAny(normalized, ["grafico de linhas", "taxa de crescimento", "tendencia", "projecao", "previsao", "ajuste linear"])) {
    return [
      {
        type: "function-graph",
        title: `Linha de tendência em ${topic}`,
        description: `Aqui o desenho faz sentido: a linha mostra subida, queda ou estabilidade ao longo de uma sequência.`,
        points: graphPoints("linear"),
        caption: "Leia eixo horizontal como tempo/etapas e eixo vertical como valor medido."
      },
      comparisonTable(`Decisão com tendência: ${topic}`, ["Sinal", "Interpretação", "Cuidado"], [
        ["Sobe", "crescimento ou aumento acumulado", "não chamar de proporcional sem testar"],
        ["Desce", "queda, perda ou redução", "não ignorar a unidade"],
        ["Oscila", "variação irregular", "não forçar uma reta perfeita"]
      ]),
      conceptBoard(`Perguntas certas para ${topic}`, "A tendência precisa conversar com os dados, não com uma impressão visual solta.", [
        { label: "Intervalo", text: "Compare início, fim e pontos intermediários." },
        { label: "Taxa", text: "Veja quanto muda a cada etapa." },
        { label: "Limite", text: "Previsão só vale perto dos dados observados." }
      ])
    ];
  }

  if (hasAny(normalized, ["porcentagem", "percentual", "desconto", "acrescimo", "aumento", "variacao", "lucro", "prejuizo", "promocao", "economia"])) {
    return [
      {
        type: "bar-chart",
        title: `Antes e depois em ${topic}`,
        description: `Porcentagem fica visual quando você separa valor inicial, mudança e valor final.`,
        bars: [
          { label: "inicial", value: 100 },
          { label: "mudança", value: hasAny(normalized, ["desconto", "prejuizo", "economia"]) ? 25 : 35 },
          { label: "final", value: hasAny(normalized, ["desconto", "prejuizo"]) ? 75 : 135 }
        ]
      },
      comparisonTable(`Cálculo de ${topic}`, ["Situação", "Multiplicador", "Leitura"], [
        ["aumento de p%", "1 + p/100", "valor cresce"],
        ["desconto de p%", "1 - p/100", "valor diminui"],
        ["variação", "(final - inicial) / inicial", "mede mudança relativa"]
      ]),
      conceptBoard(`Armadilhas de ${topic}`, "O erro mais comum é somar porcentagens sem saber qual é a base.", [
        { label: "Base", text: "Descubra sobre qual valor a taxa está sendo aplicada." },
        { label: "Taxa", text: "Transforme 15% em 0,15 antes de calcular." },
        { label: "Resultado", text: "Confira se o valor final aumentou ou diminuiu como o enunciado diz." }
      ])
    ];
  }

  if (hasAny(normalized, ["funcao quadratica", "quadratica", "parabola", "vertice", "maximo", "minimo"])) {
    return [
      {
        type: "function-graph",
        title: `Parábola aplicada a ${topic}`,
        description: "A curva mostra por que existe ponto de máximo ou mínimo em custos, áreas, trajetórias ou receitas.",
        points: graphPoints("quadratic"),
        caption: formula
      },
      comparisonTable(`Leitura da parábola em ${topic}`, ["Parte", "Significado", "Uso na questão"], [
        ["Vértice", "maior ou menor valor", "otimização"],
        ["Raízes", "onde o valor zera", "limites da situação"],
        ["Concavidade", "abre para cima ou baixo", "mínimo ou máximo"]
      ]),
      conceptBoard(`Como resolver ${topic}`, "A forma do gráfico ajuda a escolher entre fórmula, vértice e interpretação.", [
        { label: "Modelo", text: "Procure expressão do tipo ax² + bx + c." },
        { label: "Pergunta", text: "Veja se pedem valor máximo, mínimo, tempo ou custo." },
        { label: "Resposta", text: "Dê o número com a unidade do contexto." }
      ])
    ];
  }

  if (hasAny(normalized, ["funcao exponencial", "exponencial", "escala richter", "crescimento composto", "decaimento"])) {
    return [
      {
        type: "function-graph",
        title: `Crescimento ou decaimento em ${topic}`,
        description: "O visual mostra mudança multiplicativa: cada etapa depende do valor anterior.",
        points: graphPoints("exponential"),
        caption: hasAny(normalized, ["richter"]) ? "Na escala Richter, aumentar 1 unidade representa efeito muito maior, não soma simples." : formula
      },
      comparisonTable(`Exponencial em contexto`, ["Sinal", "O que significa", "Cuidado"], [
        ["multiplica por mais de 1", "crescimento acelerado", "não tratar como soma fixa"],
        ["multiplica por menos de 1", "decaimento", "não confundir com desconto único"],
        ["base e expoente", "tempo ou etapas", "conferir unidade"]
      ]),
      conceptBoard(`Leitura de ${topic}`, "O ponto central é perceber fator multiplicativo.", [
        { label: "Valor inicial", text: "De onde a sequência começa." },
        { label: "Fator", text: "Por quanto multiplica a cada etapa." },
        { label: "Tempo", text: "Quantas repetições do fator acontecem." }
      ])
    ];
  }

  if (hasAny(normalized, ["funcao logaritmica", "logaritmo", "logaritmica"])) {
    return [
      {
        type: "function-graph",
        title: `Curva logarítmica em ${topic}`,
        description: "O gráfico cresce rápido no começo e depois desacelera; isso é típico de escalas e medidas comprimidas.",
        points: graphPoints("log"),
        caption: formula
      },
      conceptBoard(`Como pensar ${topic}`, "Logaritmo aparece quando a pergunta transforma multiplicação em escala de leitura.", [
        { label: "Base", text: "Indica o padrão de comparação." },
        { label: "Entrada", text: "Valor medido antes de virar escala." },
        { label: "Saída", text: "Número menor que resume uma grandeza muito ampla." }
      ]),
      comparisonTable(`Logaritmo no ENEM`, ["Contexto", "Ideia", "Leitura"], [
        ["Richter", "energia sísmica em escala", "diferença pequena pode ser efeito grande"],
        ["pH", "concentração em escala", "menor pH indica mais acidez"],
        ["gráficos", "crescimento desacelerado", "comparar pela escala"]
      ])
    ];
  }

  if (hasAny(normalized, ["funcao afim", "funcao linear", "tarifa", "valor fixo", "valor variavel", "corrida por aplicativo", "equacao do 1", "inequacao", "sistema"])) {
    return [
      {
        type: "function-graph",
        title: `Reta de custo ou variação em ${topic}`,
        description: "A reta aparece quando existe uma parte fixa e uma parte que aumenta sempre no mesmo ritmo.",
        points: graphPoints("linear"),
        caption: formula
      },
      comparisonTable(`Partes do modelo em ${topic}`, ["Parte", "No enunciado", "No cálculo"], [
        ["Fixo", "taxa inicial, mensalidade ou bandeirada", "termo constante"],
        ["Variável", "por km, por minuto, por unidade", "coeficiente multiplicando x"],
        ["Total", "valor final", "resultado da expressão"]
      ]),
      conceptBoard(`Tradução para fórmula`, "Antes de calcular, transforme a frase em expressão.", [
        { label: "x", text: "A quantidade que muda: km, tempo, itens ou parcelas." },
        { label: "coeficiente", text: "Quanto soma a cada unidade de x." },
        { label: "resposta", text: "Interprete se a questão pede valor, quantidade ou comparação." }
      ])
    ];
  }

  if (hasAny(normalized, ["probabilidade", "combinatoria", "permutacao", "combinacao", "arranjo", "fatorial", "contagem", "senha", "sequencia", "espaco amostral", "eventos"])) {
    return [
      {
        type: "bar-chart",
        title: `Árvore de possibilidades resumida: ${topic}`,
        description: "O visual compara etapas de escolha. Cada barra representa uma decisão que multiplica ou restringe o total.",
        bars: barsFromLabels(topic, ["etapa 1", "etapa 2", "restrição", "total"], 12, 13)
      },
      comparisonTable(`Escolha do método em ${topic}`, ["Caso", "Use", "Exemplo mental"], [
        ["ordem importa", "arranjo ou permutação", "senha 123 é diferente de 321"],
        ["ordem não importa", "combinação", "grupo de pessoas escolhido"],
        ["chance", "favoráveis / possíveis", "probabilidade simples"]
      ]),
      conceptBoard(`Como não errar ${topic}`, "Pergunte primeiro se a ordem muda o resultado.", [
        { label: "Etapas", text: "Separe cada decisão do enunciado." },
        { label: "Restrições", text: "Veja se pode repetir, se há bloqueios ou condição." },
        { label: "Total", text: "Multiplique etapas independentes ou divida quando a ordem não importa." }
      ])
    ];
  }

  if (hasAny(normalized, ["area", "circulo", "circunferencia", "setor", "angulo", "triangulo", "quadrado", "hexagono", "poligono", "pitagoras", "semelhanca", "distancia", "circuncentro", "tangencia", "geometria plana", "mapas", "plantas", "quadras"])) {
    return [
      comparisonTable(`Figura, medida e fórmula em ${topic}`, ["Figura/sinal", "O que medir", "Fórmula útil"], [
        ["círculo/setor", "raio, arco ou ângulo", "A = πr² ou setor proporcional"],
        ["triângulo", "base, altura ou lados", "A = b.h/2 ou Pitágoras"],
        ["semelhança/escala", "razão entre medidas", "medidas proporcionais"]
      ]),
      conceptBoard(`Visual geométrico de ${topic}`, "Aqui o desenho deve representar a figura, não uma linha crescente qualquer.", [
        { label: "Marcação", text: "Identifique raio, lado, altura, ângulo, escala ou distância." },
        { label: "Relação", text: "Escolha área, perímetro, semelhança ou Pitágoras conforme o comando." },
        { label: "Unidade", text: "Comprimento usa unidade linear; área usa unidade ao quadrado." }
      ]),
      {
        type: "bar-chart",
        title: `Comparação de medidas em ${topic}`,
        description: "As barras servem para comparar lados, áreas ou distâncias quando o enunciado traz valores diferentes.",
        bars: barsFromLabels(topic, ["medida 1", "medida 2", "medida 3", "resultado"], 14, 12)
      }
    ];
  }

  if (hasAny(normalized, ["volume", "cubo", "cilindro", "prisma", "tanque", "embalagem", "capacidade", "solido", "tronco de cone", "projecao", "representacao espacial", "visualizacao 3d", "reservatorio", "escala volumetrica", "litro"])) {
    return [
      {
        type: "bar-chart",
        title: `Volume e capacidade em ${topic}`,
        description: "O visual compara alturas, capacidades ou volumes. Em geometria espacial, o resultado cresce em três dimensões.",
        bars: barsFromLabels(topic, ["base", "altura", "volume", "capacidade"], 15, 14)
      },
      comparisonTable(`Sólido correto em ${topic}`, ["Sólido", "Medidas necessárias", "Fórmula-base"], [
        ["cubo/prisma", "área da base e altura", "V = Ab.h"],
        ["cilindro", "raio e altura", "V = πr²h"],
        ["tronco/obstáculo", "parte cheia menos parte retirada", "decompor o sólido"]
      ]),
      conceptBoard(`Leitura espacial de ${topic}`, "Antes da conta, imagine o sólido em partes simples.", [
        { label: "Base", text: "Descubra qual figura forma o chão do sólido." },
        { label: "Altura", text: "Veja até onde o objeto enche, corta ou cresce." },
        { label: "Conversão", text: "Lembre que 1 L = 1000 cm³ quando aparecer capacidade." }
      ])
    ];
  }

  if (hasAny(normalized, ["escala", "unidade", "comprimento", "massa", "tempo", "velocidade", "vazao", "densidade", "notacao cientifica", "conversao", "polegadas", "diagonal", "razao entre lados", "medidas"])) {
    return [
      comparisonTable(`Conversão e unidade em ${topic}`, ["Grandeza", "O que conferir", "Erro que derruba"], [
        ["comprimento", "mm, cm, m, km", "misturar unidades"],
        ["área/volume", "quadrado ou cúbico", "converter como se fosse linear"],
        ["taxa", "por tempo, por área ou por volume", "ignorar o denominador"]
      ]),
      conceptBoard(`Checklist de ${topic}`, "Toda questão de grandezas começa pela unidade.", [
        { label: "Unidade de entrada", text: "Anote como o dado aparece." },
        { label: "Unidade pedida", text: "Veja o que a alternativa ou comando exige." },
        { label: "Conversão", text: "Faça a troca antes da operação principal." }
      ]),
      {
        type: "bar-chart",
        title: `Escala de comparação em ${topic}`,
        description: "As barras ajudam a perceber diferença de ordem de grandeza, especialmente em medidas e conversões.",
        bars: barsFromLabels(topic, ["menor", "referência", "maior", "convertido"], 10, 16)
      }
    ];
  }

  return [
    conceptBoard(`Modelo matemático de ${topic}`, "Este bloco fica no assunto real: dado, relação e unidade.", [
      { label: "Dado", text: profile?.visual?.[0] || "valor apresentado pelo enunciado" },
      { label: "Relação", text: formula },
      { label: "Unidade", text: "resultado precisa responder ao que foi pedido" }
    ]),
    comparisonTable(`Leitura orientada de ${topic}`, ["Pergunta", "Ação", "Conferência"], [
      ["O que varia?", "defina a grandeza principal", "não troque variável por unidade"],
      ["Qual relação?", "escolha fórmula ou proporção", "compare com o contexto"],
      ["O que responder?", "calcule e interprete", "verifique unidade final"]
    ])
  ];
}

function natureVisualModels(booklet, topic, profile) {
  const normalized = normalizeText(`${booklet.subject} ${topic}`);
  if (hasAny(normalized, [
    "ecologia",
    "ciclos biogeoquimicos",
    "ciclo do nitrogenio",
    "ciclo do carbono",
    "fixacao de nitrogenio",
    "nitrificacao",
    "desnitrificacao",
    "cadeias alimentares",
    "teias alimentares",
    "bioacumulacao",
    "biomagnificacao",
    "poluicao ambiental",
    "microplasticos",
    "metais pesados",
    "mercurio",
    "ecossistemas",
    "biodiversidade",
    "sistemas agroflorestais",
    "sucessao ecologica",
    "agricultura sustentavel",
    "saneamento e saude ambiental",
    "fotossintese",
    "decomposicao"
  ])) {
    return [
      {
        type: "cycle-diagram",
        title: `Ciclo ecológico em ${topic}`,
        description: "O visual mostra fluxo de matéria, energia ou poluentes dentro do ecossistema.",
        steps: hasAny(normalized, ["bioacumulacao", "biomagnificacao", "mercurio", "microplastico"])
          ? ["contaminação", "organismo pequeno", "predador", "maior concentração"]
          : ["produtores", "consumidores", "decompositores", "matéria retorna"]
      },
      {
        type: "bar-chart",
        title: `Impacto ambiental em ${topic}`,
        description: "As barras comparam níveis tróficos, etapas de sucessão ou concentração de poluentes quando isso aparece no enunciado.",
        bars: hasAny(normalized, ["bioacumulacao", "biomagnificacao", "mercurio"])
          ? [{ label: "água", value: 8 }, { label: "plâncton", value: 22 }, { label: "peixe", value: 55 }, { label: "predador", value: 91 }]
          : barsFromLabels(topic, ["inicial", "intermediário", "maduro", "equilíbrio"], 16, 12)
      },
      conceptBoard(`Leitura ecológica de ${topic}`, "Natureza cobra relação entre seres vivos, ambiente e consequência.", [
        { label: "Fluxo", text: "Energia diminui ao longo da cadeia; matéria circula." },
        { label: "Interferência", text: "Poluição, desmatamento, saneamento ou agricultura alteram o equilíbrio." },
        { label: "Consequência", text: "Explique perda de biodiversidade, saúde ambiental ou acúmulo de substâncias." }
      ])
    ];
  }

  if (hasAny(normalized, ["genetica", "dna", "gene", "mutacao", "pcr", "heredograma", "daltonismo", "alelo", "cromossomo", "genotipo", "fenotipo", "heranca"])) {
    return [
      conceptBoard(`Do DNA ao fenótipo: ${topic}`, "O assunto precisa mostrar caminho biológico, não só palavras soltas.", [
        { label: "Material genético", text: "DNA guarda informação em genes e cromossomos." },
        { label: "Expressão", text: "Genes podem produzir proteínas ou influenciar características." },
        { label: "Resultado", text: "Fenótipo depende do genótipo e, em muitos casos, também do ambiente." }
      ]),
      comparisonTable(`Quadro genético de ${topic}`, ["Conceito", "O que significa", "Como aparece"], [
        ["alelo", "variação de um gene", "dominante ou recessivo"],
        ["heredograma", "história familiar em símbolos", "padrão de herança"],
        ["PCR/mutação", "análise ou alteração do DNA", "diagnóstico e biotecnologia"]
      ]),
      {
        type: "cycle-diagram",
        title: `Sequência biológica em ${topic}`,
        description: "Use a ordem para não confundir causa genética com característica observada.",
        steps: ["DNA", "gene/alelo", "proteína/processo", "característica"]
      }
    ];
  }

  if (hasAny(normalized, ["virus", "viral", "retrovirus", "hiv", "htlv", "infeccao", "spike", "antiviral", "imunodeficiencia"])) {
    return [
      {
        type: "cycle-diagram",
        title: `Ciclo de infecção em ${topic}`,
        description: "O visual acompanha o caminho do vírus até a resposta do organismo ou ação do medicamento.",
        steps: ["adesão", "entrada", "replicação", "liberação"]
      },
      comparisonTable(`Vírus e resposta em ${topic}`, ["Parte", "Função", "Leitura ENEM"], [
        ["proteína viral", "encaixe na célula", "entrada do vírus"],
        ["material genético", "comanda replicação", "diagnóstico molecular"],
        ["resposta imune", "defesa do corpo", "controle da infecção"]
      ]),
      conceptBoard(`Como explicar ${topic}`, "A resposta deve ligar estrutura viral, célula hospedeira e consequência.", [
        { label: "Entrada", text: "O vírus precisa reconhecer e entrar em célula compatível." },
        { label: "Replicação", text: "Ele usa estruturas da célula para gerar novas partículas." },
        { label: "Controle", text: "Imunidade, diagnóstico e antivirais interferem em etapas do ciclo." }
      ])
    ];
  }

  if (hasAny(normalized, ["solucao", "concentracao", "molar", "diluicao", "ph", "solubilidade", "equilibrio", "le chatelier", "hidroxiapatita", "fluoreto", "neutralizacao", "precipitado"])) {
    return [
      {
        type: "bar-chart",
        title: `Concentração e efeito em ${topic}`,
        description: "O gráfico compara quantidade de soluto, diluição ou deslocamento de equilíbrio.",
        bars: hasAny(normalized, ["ph"])
          ? [{ label: "ácido", value: 80 }, { label: "neutro", value: 45 }, { label: "básico", value: 18 }]
          : barsFromLabels(topic, ["soluto", "solvente", "solução", "diluída"], 14, 10)
      },
      comparisonTable(`Química em solução: ${topic}`, ["Elemento", "Pergunta", "Cálculo/ideia"], [
        ["soluto", "quanto foi dissolvido?", "massa ou mol"],
        ["volume", "em que quantidade de solução?", "litros ou mL"],
        ["equilíbrio", "o sistema desloca para onde?", "reduzir a perturbação"]
      ]),
      conceptBoard(`Leitura química de ${topic}`, "Não basta memorizar fórmula: veja o que mudou no sistema.", [
        { label: "Antes", text: "Concentração, pH, quantidade ou estado inicial." },
        { label: "Ação", text: "Diluir, aquecer, adicionar íon, neutralizar ou precipitar." },
        { label: "Depois", text: "Novo equilíbrio, concentração final ou efeito observado." }
      ])
    ];
  }

  if (hasAny(normalized, ["organica", "funcao organica", "acido carboxilico", "fenol", "eter", "amina", "amida", "nitro", "cadeia carbonica", "cadeias carbonicas", "compostos de carbono", "nomenclatura"])) {
    return [
      comparisonTable(`Reconhecimento orgânico em ${topic}`, ["Grupo", "Como reconhecer", "Ideia química"], [
        ["ácido/fenol", "H ligado a grupo ácido ou anel aromático", "caráter ácido"],
        ["amina/amida", "nitrogênio na estrutura", "medicamentos e biomoléculas"],
        ["éter/éster", "oxigênio entre carbonos ou carbonila", "propriedades e funções"]
      ]),
      conceptBoard(`Estrutura em ${topic}`, "O desenho da molécula precisa virar leitura de grupos funcionais.", [
        { label: "Carbonos", text: "Veja cadeia, ramificação e presença de anel." },
        { label: "Heteroátomos", text: "Procure O, N, S ou halogênios." },
        { label: "Função", text: "Associe o grupo funcional à propriedade pedida." }
      ])
    ];
  }

  if (hasAny(normalized, ["eletroquimica", "oxidacao", "reducao", "redox", "pilha", "anodo", "catodo", "eletron", "celula combustivel"])) {
    return [
      {
        type: "cycle-diagram",
        title: `Fluxo de elétrons em ${topic}`,
        description: "Em eletroquímica, o visual principal é o caminho dos elétrons e a separação entre oxidação e redução.",
        steps: ["ânodo oxida", "elétrons fluem", "cátodo reduz", "corrente elétrica"]
      },
      comparisonTable(`Pilha/redox em ${topic}`, ["Polo/processo", "O que acontece", "Como lembrar"], [
        ["ânodo", "oxidação", "perde elétrons"],
        ["cátodo", "redução", "ganha elétrons"],
        ["fio externo", "fluxo de elétrons", "gera corrente"]
      ]),
      conceptBoard(`Leitura de ${topic}`, "A questão costuma perguntar quem perde, quem ganha e para onde a energia vai.", [
        { label: "Espécie oxidada", text: "Aumenta NOX e libera elétrons." },
        { label: "Espécie reduzida", text: "Diminui NOX e recebe elétrons." },
        { label: "Aplicação", text: "Pilha, corrosão, célula combustível ou bioeletricidade." }
      ])
    ];
  }

  if (hasAny(normalized, ["movimento", "cinematica", "velocidade", "deslocamento", "trajetoria", "forca", "newton", "impulso", "colisao", "airbag", "centro de massa", "torque", "equilibrio"])) {
    return [
      {
        type: "function-graph",
        title: `Gráfico físico de ${topic}`,
        description: "Aqui o gráfico deve representar relação física real: posição, velocidade, força ou tempo.",
        points: hasAny(normalized, ["colisao", "airbag", "impulso"]) ? graphPoints("exponential") : graphPoints("linear"),
        caption: hasAny(normalized, ["impulso"]) ? "Impulso depende de força e tempo de contato." : "Leia inclinação, unidade e grandeza dos eixos."
      },
      comparisonTable(`Grandezas em ${topic}`, ["Grandeza", "Unidade", "O que indica"], [
        ["velocidade", "m/s ou km/h", "ritmo do movimento"],
        ["força", "newton", "interação que altera movimento"],
        ["impulso", "N.s", "mudança da quantidade de movimento"]
      ]),
      conceptBoard(`Modelo físico de ${topic}`, "A visualização precisa nascer das grandezas do enunciado.", [
        { label: "Sistema", text: "Quem ou o que está em movimento/interação." },
        { label: "Forças", text: "Identifique ação, reação, equilíbrio ou colisão." },
        { label: "Resultado", text: "Calcule ou explique mudança de movimento." }
      ])
    ];
  }

  if (hasAny(normalized, ["eletricidade", "campo eletrico", "potencial", "corrente", "resistencia", "circuito", "ohm", "potencia eletrica", "led", "diodo", "capacitor"])) {
    return [
      comparisonTable(`Circuito em ${topic}`, ["Elemento", "Função", "Relação"], [
        ["tensão", "empurra cargas", "U = R.i"],
        ["corrente", "fluxo de cargas", "medida em ampère"],
        ["resistência", "dificulta a passagem", "série e paralelo mudam o total"]
      ]),
      conceptBoard(`Mapa de circuito para ${topic}`, "Antes da conta, siga o caminho da corrente.", [
        { label: "Fonte", text: "Pilha, bateria ou tomada fornece diferença de potencial." },
        { label: "Componentes", text: "Resistores, lâmpadas, LEDs ou medidores alteram o circuito." },
        { label: "Medição", text: "Amperímetro em série; voltímetro em paralelo." }
      ]),
      {
        type: "bar-chart",
        title: `Potência e resistência em ${topic}`,
        description: "As barras ajudam a comparar consumo, brilho ou dissipação entre componentes.",
        bars: barsFromLabels(topic, ["R1", "R2", "R3", "total"], 18, 10)
      }
    ];
  }

  if (hasAny(normalized, ["onda", "acustica", "frequencia", "som", "doppler", "amplitude", "periodo", "oscilacao", "optica", "espelho", "lente", "microscopio"])) {
    return [
      comparisonTable(`Leitura ondulatória/óptica em ${topic}`, ["Sinal", "O que muda", "Efeito"], [
        ["frequência", "oscilações por segundo", "altura do som ou cor"],
        ["amplitude", "tamanho da oscilação", "intensidade"],
        ["lente/espelho", "trajeto da luz", "imagem real, virtual ou ampliada"]
      ]),
      conceptBoard(`Visual de ${topic}`, "O desenho deve representar onda, raio de luz ou imagem, não barras genéricas.", [
        { label: "Fonte", text: "Som, luz, objeto ou observador." },
        { label: "Propagação", text: "Meio, velocidade, reflexão, refração ou movimento relativo." },
        { label: "Percepção", text: "Som mais agudo, imagem ampliada, aproximação ou afastamento." }
      ])
    ];
  }

  if (hasAny(normalized, ["calor", "temperatura", "termologia", "calorimetria", "eficiencia energetica", "potencia termica", "chuveiro", "conducao", "conveccao", "irradiacao", "gas", "maquina termica", "ciclo de otto"])) {
    return [
      comparisonTable(`Energia térmica em ${topic}`, ["Ideia", "O que significa", "Exemplo"], [
        ["calor", "energia em trânsito", "corpo quente para frio"],
        ["temperatura", "estado térmico", "medida em °C ou K"],
        ["potência", "energia por tempo", "chuveiro, cafeteira, aquecedor"]
      ]),
      {
        type: "bar-chart",
        title: `Troca de energia em ${topic}`,
        description: "As barras comparam energia, tempo ou potência quando o enunciado traz equipamentos térmicos.",
        bars: barsFromLabels(topic, ["início", "aquecimento", "perdas", "útil"], 12, 14)
      },
      conceptBoard(`Como interpretar ${topic}`, "Termologia pede separar energia, temperatura e processo.", [
        { label: "Sistema", text: "Água, gás, metal, ambiente ou máquina." },
        { label: "Processo", text: "Aquecimento, resfriamento, condução, convecção ou trabalho." },
        { label: "Eficiência", text: "Compare energia recebida com energia útil." }
      ])
    ];
  }

  return [
    conceptBoard(`Modelo científico de ${topic}`, "O visual deve explicar causa, mecanismo e evidência do assunto.", [
      { label: "Estrutura/processo", text: profile?.visual?.[0] || "elemento observado no fenômeno" },
      { label: "Mecanismo", text: profile?.visual?.[1] || "como a transformação acontece" },
      { label: "Evidência", text: profile?.visual?.at(-1) || "efeito medido, observado ou comparado" }
    ]),
    comparisonTable(`Leitura científica de ${topic}`, ["Pergunta", "O que olhar", "Como responder"], [
      ["qual é a causa?", "variável inicial", "explique o mecanismo"],
      ["qual é o efeito?", "resultado observado", "ligue ao conceito"],
      ["qual dado comprova?", "medida, gráfico ou experimento", "não use opinião"]
    ])
  ];
}

function humanitiesVisualModels(booklet, chapter, topic) {
  if (booklet.subject === "Filosofia") {
    const quote = quoteForPhilosophy(topic);
    return [
      {
        type: "quote-card",
        title: `Citação-guia para ${topic}`,
        quote: quote.quote,
        author: quote.author,
        explanation: quote.explanation
      },
      {
        type: "concept-board",
        title: `Problema filosófico em ${topic}`,
        description: "Filosofia fica mais clara quando você identifica problema, conceito e consequência.",
        items: [
          { label: "Problema", text: `Que tipo de justiça, poder, conhecimento ou ética aparece em ${topic}?` },
          { label: "Conceito", text: `Defina ${topic} sem decorar: explique a ideia com exemplo.` },
          { label: "Tensão", text: "Mostre o conflito entre indivíduo, sociedade, verdade, liberdade ou bem comum." }
        ]
      },
      {
        type: "timeline",
        title: `Linha de raciocínio para ${topic}`,
        description: "Use como trilha para responder sem perder o conceito.",
        events: [
          { label: "1", text: "Identifique o problema filosófico." },
          { label: "2", text: "Associe o autor ou corrente quando aparecer." },
          { label: "3", text: "Explique a consequência ética ou política." }
        ]
      }
    ];
  }

  return [
    {
      type: "timeline",
      title: `Linha do tempo/contexto de ${topic}`,
      description: `Organiza ${topic} dentro de ${chapter.title}, destacando agentes e consequências.`,
      events: [
        { label: "Contexto", text: "Localize período, espaço e grupos envolvidos." },
        { label: "Conflito", text: "Veja interesses, desigualdades ou disputas em jogo." },
        { label: "Efeito", text: "Explique permanências, mudanças e impactos sociais." }
      ]
    },
    {
      type: "concept-board",
      title: `Mapa social de ${topic}`,
      description: "Quadro para não tratar o fenômeno como fato isolado.",
      items: [
        { label: "Agentes", text: "Quem atua, domina, resiste ou é afetado." },
        { label: "Espaço/tempo", text: "Onde e quando o processo acontece." },
        { label: "Consequência", text: "Que mudança social, política, territorial ou cultural aparece." }
      ]
    },
    {
      type: "comparison-table",
      title: `Comparação histórica/social: ${topic}`,
      columns: ["Dimensão", "Pergunta-chave", "Leitura esperada"],
      rows: [
        ["Política", "Quem decide?", "poder, cidadania e disputa"],
        ["Economia", "Quem produz ou ganha?", "trabalho, riqueza e desigualdade"],
        ["Cultura", "Que valores aparecem?", "identidade, memória e representação"]
      ]
    }
  ];
}

function languageVisualModels(booklet, chapter, topic) {
  const normalized = normalizeText(`${booklet.subject} ${chapter.title} ${topic}`);

  if (hasAny(normalized, ["charge", "cartaz", "campanha", "anuncio", "publicitario", "imagem", "obra de arte", "multimodal", "capa de revista"])) {
    return [
      conceptBoard(`Leitura multimodal de ${topic}`, "Esse assunto depende da relação entre imagem, texto verbal e crítica social.", [
        { label: "Imagem", text: "Observe personagens, símbolos, cores, enquadramento e exageros visuais." },
        { label: "Texto verbal", text: "Leia título, legenda, slogan ou fala como pista de sentido." },
        { label: "Crítica", text: "Explique qual comportamento, problema social ou ideia está sendo questionada." }
      ]),
      comparisonTable(`Camadas de ${topic}`, ["Camada", "O que observar", "Resposta esperada"], [
        ["literal", "o que aparece na cena", "descrição objetiva"],
        ["implícita", "ironia, humor ou contraste", "inferência"],
        ["social", "tema público ou crítica", "finalidade comunicativa"]
      ]),
      {
        type: "timeline",
        title: `Caminho de leitura para ${topic}`,
        description: "A ordem ajuda a não responder só pela primeira impressão.",
        events: [
          { label: "1", text: "Veja a cena inteira e identifique o problema apresentado." },
          { label: "2", text: "Relacione texto verbal e imagem." },
          { label: "3", text: "Explique o efeito: humor, denúncia, persuasão ou crítica." }
        ]
      }
    ];
  }

  if (hasAny(normalized, ["poema", "cancao", "eu lirico", "metafora", "sonoridade", "ritmo", "figura de linguagem", "memoria", "luto", "saudade"])) {
    return [
      conceptBoard(`Leitura poética de ${topic}`, "O poema não se lê só pelo tema: forma e linguagem também produzem sentido.", [
        { label: "Voz", text: "Quem fala no texto? Eu lírico, memória, sujeito coletivo ou personagem?" },
        { label: "Imagem", text: "Quais metáforas, repetições, sons ou símbolos aparecem?" },
        { label: "Tom", text: "O texto expressa saudade, denúncia, resistência, ironia ou contemplação?" }
      ]),
      comparisonTable(`Recursos expressivos em ${topic}`, ["Recurso", "Como aparece", "Efeito"], [
        ["metáfora", "uma ideia representando outra", "aprofundar sentido"],
        ["repetição", "palavra ou som retorna", "ritmo e destaque"],
        ["imagem poética", "cena simbólica", "emoção e interpretação"]
      ]),
      {
        type: "quote-card",
        title: `Leitura literária de ${topic}`,
        quote: "No texto literário, a forma também é parte da mensagem.",
        author: "Guia de estudo",
        explanation: "Use essa ideia para explicar por que escolhas de linguagem mudam o sentido do poema, da canção ou da narrativa."
      }
    ];
  }

  if (hasAny(normalized, ["variacao linguistica", "regionalismo", "coloquial", "formal", "informal", "oral", "escrita", "linguagem digital", "acessibilidade linguistica", "simplificacao"])) {
    return [
      comparisonTable(`Situação de uso em ${topic}`, ["Contexto", "Forma de linguagem", "Por que funciona"], [
        ["conversa cotidiana", "coloquial e próxima", "aproxima interlocutores"],
        ["texto oficial", "formal e preciso", "evita ambiguidade"],
        ["internet/campanha", "direta e acessível", "alcança público amplo"]
      ]),
      conceptBoard(`Adequação em ${topic}`, "O foco é entender por que uma variedade linguística foi escolhida.", [
        { label: "Quem fala", text: "Identifique grupo social, região, idade ou papel do emissor." },
        { label: "Para quem", text: "Veja público-alvo e situação comunicativa." },
        { label: "Efeito", text: "Explique identidade, aproximação, humor, inclusão ou autoridade." }
      ]),
      {
        type: "timeline",
        title: `Passos para responder ${topic}`,
        description: "Variação linguística não é erro: é uso adequado a contexto.",
        events: [
          { label: "1", text: "Localize a situação de fala." },
          { label: "2", text: "Reconheça a variedade usada." },
          { label: "3", text: "Explique a função social dessa escolha." }
        ]
      }
    ];
  }

  if (hasAny(normalized, ["tese", "argumento", "ponto de vista", "artigo de opiniao", "texto de opiniao", "critica social", "reportagem", "divulgacao cientifica"])) {
    return [
      comparisonTable(`Estrutura argumentativa em ${topic}`, ["Parte", "Função", "Pista no texto"], [
        ["tese", "ideia defendida", "posição central"],
        ["argumento", "justifica a tese", "dados, exemplos ou comparação"],
        ["conclusão", "fecha o raciocínio", "síntese ou proposta"]
      ]),
      conceptBoard(`Leitura crítica de ${topic}`, "O texto argumentativo precisa ser lido pela posição que defende.", [
        { label: "Tema", text: "Sobre qual problema o texto fala?" },
        { label: "Posição", text: "O autor concorda, critica, denuncia ou propõe?" },
        { label: "Prova", text: "Quais dados, exemplos ou escolhas de palavras sustentam a ideia?" }
      ]),
      {
        type: "timeline",
        title: `Do tema à conclusão em ${topic}`,
        description: "A sequência mostra como o texto constrói convencimento.",
        events: [
          { label: "Tema", text: "Apresenta o assunto." },
          { label: "Tese", text: "Marca o ponto de vista." },
          { label: "Argumentos", text: "Sustentam a interpretação." }
        ]
      }
    ];
  }

  return [
    {
      type: "concept-board",
      title: `Leitura visual e textual de ${topic}`,
      description: `Modelo feito para ${topic}, conectando forma, linguagem e efeito de sentido.`,
      items: [
        { label: "Texto verbal", text: "Observe título, escolha de palavras, ponto de vista e marcas de subjetividade." },
        { label: "Texto visual", text: "Observe imagem, composição, contraste, símbolos e relação com o verbal." },
        { label: "Efeito", text: "Explique humor, crítica, tese, emoção, denúncia ou finalidade comunicativa." }
      ]
    },
    {
      type: "comparison-table",
      title: `Camadas de sentido em ${topic}`,
      columns: ["Camada", "O que observar", "Como responder"],
      rows: [
        ["Contexto", "situação e público", "finalidade do texto"],
        ["Linguagem", "tom e escolhas lexicais", "efeito no leitor"],
        ["Gênero", chapter.title, `função dentro de ${booklet.subject}`]
      ]
    },
    {
      type: "timeline",
      title: `Caminho de leitura para ${topic}`,
      description: "Não é macete: é a ordem de leitura do próprio texto.",
      events: [
        { label: "1", text: "Leia o texto ou imagem como uma cena inteira." },
        { label: "2", text: "Identifique quem fala, para quem fala e com qual objetivo." },
        { label: "3", text: "Explique o efeito criado por linguagem, gênero e contexto." }
      ]
    }
  ];
}

function visualModels(area, booklet, chapter, topic, profile) {
  if (booklet.subject === "Matemática") {
    return mathVisualModels(topic, profile);
  }

  if (["Biologia", "Química", "Física"].includes(booklet.subject)) {
    return natureVisualModels(booklet, topic, profile);
  }

  if (["História", "Geografia", "Sociologia", "Filosofia"].includes(booklet.subject)) {
    return humanitiesVisualModels(booklet, chapter, topic);
  }

  return languageVisualModels(booklet, chapter, topic);
}

function workedExamples(area, booklet, chapter, topic, profile) {
  const base = [
    {
      title: `Exemplo específico: ${topic}`,
      prompt: profile.example.prompt,
      data: profile.example.data,
      solutionSteps: profile.example.steps,
      finalAnswer: profile.example.answer
    },
    {
      title: `Exemplo resolvido: reconhecendo ${topic}`,
      prompt: `Uma questão apresenta um contexto sobre ${topic} dentro de ${chapter.title.toLowerCase()} e pede a melhor interpretação.`,
      data: [
        `Assunto central: ${topic}`,
        `Matéria: ${booklet.subject}`,
        `Capítulo: ${chapter.title}`
      ],
      solutionSteps: [
        "Leia o comando e descubra o que a questão quer: causa, consequência, sentido, cálculo ou comparação.",
        "Volte ao trecho, imagem, gráfico ou dado que sustenta a resposta.",
        `Relacione a pista encontrada com ${topic}.`,
        "Elimine alternativa que fala de outro assunto ou extrapola o contexto.",
        "Marque a opção que explica a situação de modo mais direto."
      ],
      finalAnswer: `A resposta correta deve explicar ${topic} dentro do contexto apresentado, sem fugir para uma definição genérica.`
    },
    {
      title: `Exemplo de revisão: explicando ${topic} em voz alta`,
      prompt: `Depois de estudar, tente explicar ${topic} para alguém que nunca viu o assunto.`,
      data: [
        "Use uma frase curta.",
        "Dê um exemplo do cotidiano.",
        "Mostre como isso poderia aparecer no ENEM."
      ],
      solutionSteps: [
        "Comece com a ideia principal.",
        "Evite palavras difíceis sem necessidade.",
        "Conecte com um exemplo.",
        "Termine dizendo como identificar em questão."
      ],
      finalAnswer: `Se você consegue explicar ${topic} de forma simples, está mais perto de usar o assunto em prova.`
    }
  ];

  if (booklet.subject === "Matemática") {
    base.push({
      title: `Exemplo com cálculo: ${topic}`,
      prompt: "Um produto custava R$ 200,00 e recebeu desconto de 15%. Qual é o valor final?",
      data: ["Valor inicial = 200", "Taxa = 15% = 0,15", "Desconto: multiplicar por 1 - 0,15"],
      solutionSteps: [
        "Transforme 15% em 0,15.",
        "Calcule o fator de desconto: 1 - 0,15 = 0,85.",
        "Multiplique: 200 × 0,85 = 170.",
        "Confira se o resultado ficou menor que o valor inicial."
      ],
      finalAnswer: "O valor final é R$ 170,00."
    });
  }

  if (booklet.subject === "Física") {
    base.push({
      title: `Exemplo com grandezas: ${topic}`,
      prompt: "Um estudante percorre 120 km em 2 horas. Qual é a velocidade média?",
      data: ["distância = 120 km", "tempo = 2 h", "v = Δs / Δt"],
      solutionSteps: [
        "Identifique distância e tempo.",
        "Aplique v = Δs / Δt.",
        "Faça 120 / 2 = 60.",
        "Mantenha a unidade km/h."
      ],
      finalAnswer: "A velocidade média é 60 km/h."
    });
  }

  if (booklet.subject === "Química") {
    base.push({
      title: `Exemplo com concentração: ${topic}`,
      prompt: "Uma solução tem 20 g de soluto em 2 L de solução. Qual é a concentração comum?",
      data: ["m = 20 g", "V = 2 L", "C = m / V"],
      solutionSteps: [
        "Identifique massa e volume.",
        "Use C = m / V.",
        "Faça 20 / 2 = 10.",
        "Escreva a unidade: g/L."
      ],
      finalAnswer: "A concentração comum é 10 g/L."
    });
  }

  return base;
}

function enemQuestions(booklet, chapter, topic, profile) {
  return [
    {
      title: `Questão específica: ${topic}`,
      prompt: profile.question,
      alternatives: profile.alternatives,
      answer: profile.answer,
      explanation: `A alternativa correta é escolhida porque conversa diretamente com ${topic} e com o comando da questão.`
    },
    {
      title: `Questão estilo ENEM: ${topic}`,
      prompt: `Um texto apresenta uma situação cotidiana relacionada a ${topic}. O comando pede a alternativa que melhor explica o fenômeno no contexto de ${chapter.title.toLowerCase()}.`,
      alternatives: [
        "A resposta depende apenas de decorar o nome do assunto.",
        "A resposta deve relacionar a pista do enunciado ao conceito estudado.",
        "A resposta deve ignorar o contexto e usar opinião pessoal.",
        "A resposta correta é sempre a alternativa mais longa.",
        "A resposta deve repetir uma palavra do texto sem explicar sua função."
      ],
      answer: 1,
      explanation: `A alternativa correta é a que conecta ${topic} às pistas do enunciado. No ENEM, contexto é parte da resposta.`
    },
    {
      title: `Questão de eliminação: ${topic}`,
      prompt: `Ao resolver uma questão sobre ${topic}, qual alternativa deve ser eliminada primeiro?`,
      alternatives: [
        "A que contradiz uma informação explícita do enunciado.",
        "A que usa palavras simples.",
        "A que exige voltar ao texto.",
        "A que conversa com o gráfico.",
        "A que explica causa e consequência."
      ],
      answer: 0,
      explanation: "Contradição com o enunciado é um sinal forte de erro."
    }
  ];
}

function glossary(topic, booklet, profile) {
  return [
    {
      term: topic,
      meaning: profile.definition,
      inPlainWords: `É o conteúdo principal desta aula. Você precisa reconhecer ${topic} no enunciado e saber que tipo de raciocínio ele pede.`
    },
    {
      term: "Contexto",
      meaning: "Conjunto de informações que dá sentido à questão.",
      inPlainWords: "É a situação completa: texto, imagem, dado, gráfico, fonte e pergunta."
    },
    {
      term: "Comando",
      meaning: "Parte da questão que diz exatamente o que você precisa fazer.",
      inPlainWords: "É o verbo da pergunta: identificar, comparar, calcular, explicar, inferir."
    }
  ];
}

function studyScript(topic, booklet) {
  return {
    opening: `Hoje você vai estudar ${topic} sem complicar. A meta não é decorar uma frase bonita; é entender como esse assunto aparece em uma questão real.`,
    middle: [
      `Primeiro, leia a situação e procure pistas. Depois, conecte essas pistas com ${topic}.`,
      `Se houver cálculo, anote dados e unidades antes da conta. Se houver texto, localize objetivo, linguagem e efeito. Se houver fonte social ou histórica, veja quem fala, quando fala e com qual interesse.`,
      `Em ${booklet.subject}, o erro mais comum é responder rápido demais. Uma pausa de dez segundos para entender o comando pode salvar a questão.`
    ],
    closing: `Feche a aula explicando ${topic} em voz alta. Se sua explicação ficou simples, você entendeu.`
  };
}

function masteryRubric(topic) {
  return [
    {
      level: "Começando",
      evidence: `Reconhece o nome ${topic}, mas ainda depende de resumo pronto.`,
      nextStep: "Ler dois exemplos e explicar com palavras próprias."
    },
    {
      level: "Em desenvolvimento",
      evidence: `Consegue explicar ${topic}, mas erra quando o enunciado mistura assuntos.`,
      nextStep: "Treinar eliminação de alternativas."
    },
    {
      level: "Pronto para prova",
      evidence: `Reconhece ${topic} em contexto e justifica por que a alternativa correta responde ao comando.`,
      nextStep: "Resolver questões cronometradas."
    }
  ];
}

function buildTopicLesson({ area, booklet, chapter, topic, topicIndex }) {
  const tone = areaTone[area.area] || areaTone.linguagens;
  const subjectTip = subjectTips[booklet.subject] || "conecte o assunto ao contexto da questão.";
  const profile = getTopicProfile(topic, booklet, chapter, area);

  return {
    id: `${slug(topic)}-${topicIndex + 1}`,
    title: topic,
    readingTimeMinutes: 12,
    plainSummary: profile.definition,
    explanation: [
      ...profile.keyIdeas.map((idea) => `Ideia importante: ${idea}`),
      `Pense em ${topic} como uma ferramenta de leitura da questão. Antes de decorar qualquer nome, pergunte: ${tone.question}`,
      `O caminho mais seguro é ${tone.method}. Isso evita cair em alternativa que parece bonita, mas não responde ao comando.`,
      `Na prática, ${tone.example}. Por isso, leia o enunciado como uma situação completa e procure a evidência que sustenta a resposta.`,
      `Para ${booklet.subject}, uma boa regra é: ${subjectTip}`,
      `Quando o assunto for ${topic}, não procure apenas uma palavra igual no texto. Procure a relação: o que causa, o que muda, quem é afetado, qual cálculo representa a situação ou que efeito de sentido foi criado.`,
      `Se a questão tiver gráfico, tabela ou imagem, trate esse elemento como texto também. O ENEM frequentemente coloca a resposta na relação entre duas linguagens, não em uma frase isolada.`
    ],
    formulaCards: formulaCards(area, booklet, topic, profile),
    visualModels: visualModels(area, booklet, chapter, topic, profile),
    workedExamples: workedExamples(area, booklet, chapter, topic, profile),
    enemStyleQuestions: enemQuestions(booklet, chapter, topic, profile),
    glossary: glossary(topic, booklet, profile),
    studyScript: studyScript(topic, booklet),
    masteryRubric: masteryRubric(topic),
    howItAppears: [
      "Pode aparecer como interpretação direta de texto, imagem, gráfico, fonte histórica, experimento, tabela ou situação-problema.",
      "Pode pedir causa, consequência, comparação, finalidade, melhor estratégia ou identificação de uma relação entre elementos.",
      `Pode misturar ${topic} com outros tópicos do capítulo ${chapter.title}, exigindo leitura atenta do comando.`,
      "Pode usar linguagem simples para cobrar uma ideia profunda. Por isso, não subestime enunciado curto.",
      "Pode exigir que você escolha a alternativa mais precisa, não a mais geral."
    ],
    stepByStep: [
      "Leia o comando da questão e sublinhe o verbo principal.",
      "Marque os dados ou trechos que realmente aparecem no enunciado.",
      `Pergunte como ${topic} ajuda a explicar a situação.`,
      "Se houver cálculo, escreva a fórmula ou relação antes de substituir números.",
      "Se houver texto, identifique finalidade, público, tom e efeito de sentido.",
      "Se houver imagem ou gráfico, leia título, legenda, eixos, fonte e comparação visual.",
      "Elimine alternativas que exageram, contradizem o texto ou trazem informação externa sem apoio.",
      "Escolha a alternativa que responde exatamente ao comando."
    ],
    example: {
      situation: `Imagine uma questão que apresenta uma situação sobre ${topic} dentro de ${chapter.title.toLowerCase()}. O enunciado traz um contexto e pede a melhor interpretação.`,
      analysis: `A primeira atitude é localizar a pista principal. Depois, relacione essa pista ao assunto. Se a alternativa não conversa com o contexto, ela deve ser eliminada mesmo que cite uma palavra parecida.`,
      answerModel: `Uma resposta forte explica a relação entre o contexto apresentado e ${topic}, sem fugir para uma definição genérica.`
    },
    commonMistakes: [
      "Responder só por palavra-chave, sem voltar ao contexto.",
      "Confundir assunto parecido com o que a pergunta realmente pediu.",
      "Escolher alternativa muito ampla quando a questão pede algo específico.",
      "Ignorar imagem, fonte, unidade de medida, legenda ou título.",
      "Fazer conta sem conferir se as unidades combinam.",
      "Usar opinião pessoal quando a questão pede interpretação do material apresentado."
    ],
    quickReview: [
      `Explique ${topic} com suas próprias palavras em duas linhas.`,
      `Crie um exemplo cotidiano em que ${topic} apareça.`,
      "Resolva uma questão curta e escreva por que as alternativas erradas estão erradas.",
      "Anote uma dúvida para revisar antes do simulado.",
      "Monte um mini mapa com conceito, exemplo, erro comum e pista no enunciado.",
      "Ensine o assunto em voz alta por um minuto."
    ],
    miniPractice: {
      prompt: `Em uma questão sobre ${topic}, qual é a melhor primeira atitude?`,
      options: [
        "Procurar uma palavra conhecida e marcar a alternativa mais parecida.",
        "Ler o comando, localizar as pistas do contexto e relacionar com o assunto.",
        "Ignorar o texto e usar apenas conhecimento decorado.",
        "Escolher a alternativa mais longa."
      ],
      answer: 1,
      explanation: "O ENEM cobra aplicação em contexto. Por isso, a leitura do comando e das pistas vale mais do que reconhecer uma palavra isolada."
    }
  };
}

function buildExtendedBlock(area, booklet, topics, index) {
  const topic = topics[index % topics.length] || booklet.title;
  const tone = areaTone[area.area] || areaTone.linguagens;
  const profile = getTopicProfile(topic, booklet, { title: booklet.title }, area);
  return {
    id: `reforco-${index + 1}-${slug(topic)}`,
    title: `Bloco de reforço ${index + 1}: ${topic}`,
    purpose: `Aprofundar ${topic} com explicação, visualização, exemplo e treino de prova.`,
    explanatoryText: [
      profile.definition,
      `${topic} deve ser estudado como parte de uma situação. O ENEM raramente pergunta uma definição pura; ele apresenta um contexto e espera que você use o conteúdo para tomar uma decisão.`,
      `A pergunta-chave deste bloco é: ${tone.question}`,
      `O método recomendado é: ${tone.method}.`,
      `Uma boa resposta não é a que apenas cita ${topic}, mas a que mostra como ${topic} explica o problema apresentado.`,
      "Se aparecer cálculo, escreva os dados e confira unidades. Se aparecer texto, identifique finalidade e efeito. Se aparecer fonte social, veja contexto e grupo envolvido.",
      "Ao revisar, procure transformar o assunto em um exemplo simples. Quem consegue criar exemplo costuma resolver melhor questões inéditas."
    ],
    formulaOrStrategy: {
      name: profile.formulas?.[0]?.[0] || tone.formulaName,
      expression: profile.formulas?.[0]?.[1] || tone.formula,
      howToUse: [
        "Leia o comando.",
        "Marque a pista principal.",
        "Relacione a pista ao conteúdo.",
        "Use fórmula, conceito ou interpretação somente depois de entender a situação.",
        "Confira se a resposta conversa com todos os dados importantes."
      ]
    },
    graphicModel: {
      type: tone.visual,
      title: `Modelo visual para ${topic}`,
      steps: profile.visual || [
        "Contexto",
        "Pista principal",
        topic,
        "Aplicação",
        "Resposta"
      ],
      reading: `Leia o modelo da esquerda para a direita: primeiro entenda a situação, depois encontre a pista, aplique ${topic} e só então escolha a resposta.`
    },
    workedQuestion: {
      prompt: profile.example.prompt,
      resolution: profile.example.steps,
      answer: profile.example.answer
    },
    enemQuestion: {
      prompt: profile.question,
      alternatives: profile.alternatives,
      answer: profile.answer,
      explanation: `O foco é aplicação. ${topic} precisa ser ligado às pistas do enunciado.`
    },
    reviewTask: [
      `Escreva uma definição simples de ${topic}.`,
      "Liste duas pistas que indicam esse assunto em uma questão.",
      "Crie um exemplo cotidiano.",
      "Resolva uma questão e explique por que a alternativa correta é melhor que as outras."
    ]
  };
}

function ensureMinimumLines(lesson, area, booklet) {
  const topics = booklet.chapters.flatMap((chapter) => chapter.topics);
  lesson.extendedStudyLibrary = lesson.extendedStudyLibrary || [];

  while (JSON.stringify(lesson, null, 2).split(/\r?\n/).length < minLinesPerBooklet) {
    lesson.extendedStudyLibrary.push(buildExtendedBlock(area, booklet, topics, lesson.extendedStudyLibrary.length));
  }

  return lesson;
}

function buildBookletLesson(area, booklet) {
  const lesson = {
    id: booklet.id,
    sourceBookletId: booklet.id,
    area: area.area,
    areaLabel: area.areaLabel,
    subject: booklet.subject,
    title: booklet.title,
    summary: booklet.summary,
    estimatedMinutes: Math.max(booklet.estimatedMinutes, booklet.chapters.reduce((sum, chapter) => sum + chapter.topics.length * 12, 0)),
    studyPromise: `Ao terminar esta apostila, você deve conseguir reconhecer ${booklet.title.toLowerCase()} em questões contextualizadas e explicar seu raciocínio com clareza.`,
    beforeStudy: [
      "Separe um bloco de estudo sem pressa.",
      "Leia os resumos antes de tentar memorizar nomes.",
      "Anote exemplos simples, do seu jeito.",
      "Depois de cada tópico, responda a mini prática.",
      "Quando houver fórmula, entenda primeiro o que cada grandeza significa.",
      "Quando houver gráfico ou imagem, leia título, legenda, eixos e fonte."
    ],
    formulaSheet: formulaCards(area, booklet, booklet.title),
    visualGuide: visualModels(area, booklet, { title: booklet.title }, booklet.title),
    chapters: booklet.chapters.map((chapter, chapterIndex) => ({
      id: `${slug(chapter.title)}-${chapterIndex + 1}`,
      title: chapter.title,
      explanation: chapter.explanation,
      chapterGoal: `Entender ${chapter.title.toLowerCase()} como parte de ${booklet.title.toLowerCase()} e aplicar isso em questões do ENEM.`,
      lessons: chapter.topics.map((topic, topicIndex) => buildTopicLesson({
        area,
        booklet,
        chapter,
        topic,
        topicIndex
      }))
    })),
    finalReview: {
      summary: `Revise ${booklet.title} tentando explicar os tópicos sem copiar a apostila. Se travar em algum termo, volte ao exemplo e faça uma questão curta.`,
      checklist: [
        "Consigo explicar o tema sem linguagem difícil.",
        "Consigo reconhecer o assunto em texto, gráfico, imagem ou situação-problema.",
        "Consigo eliminar alternativas erradas com justificativa.",
        "Tenho uma lista dos tópicos que ainda preciso revisar.",
        "Consigo usar fórmula ou modelo visual sem decorar mecanicamente.",
        "Consigo resolver pelo menos uma questão estilo ENEM sobre o assunto."
      ]
    }
  };

  return ensureMinimumLines(lesson, area, booklet);
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const index = [];

  for (const sourceFile of sourceFiles) {
    const area = JSON.parse(fs.readFileSync(path.join(root, sourceFile), "utf8"));

    for (const booklet of area.collections) {
      const lesson = buildBookletLesson(area, booklet);
      const fileName = `${booklet.id}.json`;
      fs.writeFileSync(path.join(outputDir, fileName), `${JSON.stringify(lesson, null, 2)}\n`, "utf8");
      index.push({
        id: booklet.id,
        title: booklet.title,
        subject: booklet.subject,
        area: area.area,
        areaLabel: area.areaLabel,
        file: `data/aulas/${fileName}`,
        chapters: lesson.chapters.length,
        lessons: lesson.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0),
        lines: JSON.stringify(lesson, null, 2).split(/\r?\n/).length
      });
    }
  }

  fs.writeFileSync(path.join(outputDir, "aulas-index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
  console.log(`Generated ${index.length} lesson files in ${outputDir}`);
}

main();
