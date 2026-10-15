/* ==========================================================
   Preço e Tempo — ODS 12
   Módulos: Calc (lógica pura) · Calculadora (UI) · Menu
            · Problemas · Quiz · Simulador · Custo por uso · Compromisso
   ========================================================== */
(function () {
  "use strict";

  const WORKDAY_HOURS = 8;
  const MAX_MONTH_HOURS = 744; // 31 dias × 24 h

  /* ---------- Lógica pura (testável) ---------- */
  const Calc = {
    /**
     * Converte texto digitado em número. Aceita "1.299,90", "1299,90", "1299.90", "R$ 300".
     * Retorna NaN para entradas inválidas.
     */
    parseNumber(raw) {
      if (typeof raw !== "string") return NaN;
      let s = raw.replace(/R\$/gi, "").replace(/\s/g, "");
      if (s === "" || !/^-?[\d.,]+$/.test(s)) return NaN;
      const negative = s.startsWith("-");
      if (negative) s = s.slice(1);

      const hasComma = s.includes(",");
      const hasDot = s.includes(".");
      if (hasComma && hasDot) {
        // O último separador é o decimal.
        const dec = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
        const thou = dec === "," ? "." : ",";
        if (s.split(dec).length > 2) return NaN;
        s = s.split(thou).join("").replace(dec, ".");
      } else if (hasComma) {
        if (s.split(",").length > 2) return NaN;
        s = s.replace(",", ".");
      } else if (hasDot) {
        const parts = s.split(".");
        const looksThousands = parts.length > 2 || (parts.length === 2 && /^\d{3}$/.test(parts[1]) && parts[0].length <= 3 && parts[0] !== "0");
        if (looksThousands) s = parts.join("");
      }
      if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
      const n = parseFloat(s);
      return negative ? -n : n;
    },

    hourlyFromMonthly(monthlyIncome, monthlyHours) {
      return monthlyIncome / monthlyHours;
    },

    hoursNeeded(price, hourlyWage) {
      return price / hourlyWage;
    },

    /** Valida os valores já convertidos. Retorna { campo: mensagem } */
    validate({ price, mode, hourly, income, monthHours }) {
      const errors = {};
      if (Number.isNaN(price)) errors.preco = "Informe o preço do produto, por exemplo 300,00.";
      else if (price < 0) errors.preco = "O preço não pode ser negativo.";
      else if (price === 0) errors.preco = "O preço precisa ser maior que zero.";
      else if (price > 1e9) errors.preco = "Esse valor é alto demais. Informe um preço menor.";

      if (mode === "hora") {
        if (Number.isNaN(hourly)) errors.hora = "Informe seu valor por hora, por exemplo 15,00.";
        else if (hourly < 0) errors.hora = "O valor por hora não pode ser negativo.";
        else if (hourly === 0) errors.hora = "O valor por hora precisa ser maior que zero.";
        else if (hourly > 1e7) errors.hora = "Esse valor por hora é alto demais.";
      } else {
        if (Number.isNaN(income)) errors.renda = "Informe sua renda mensal, por exemplo 2.640,00.";
        else if (income < 0) errors.renda = "A renda mensal não pode ser negativa.";
        else if (income === 0) errors.renda = "A renda mensal precisa ser maior que zero.";
        else if (income > 1e9) errors.renda = "Esse valor é alto demais. Informe uma renda menor.";

        if (Number.isNaN(monthHours)) errors.horas = "Informe as horas trabalhadas por mês, por exemplo 176.";
        else if (monthHours < 0) errors.horas = "As horas não podem ser negativas.";
        else if (monthHours === 0) errors.horas = "As horas por mês precisam ser maiores que zero.";
        else if (monthHours > MAX_MONTH_HOURS) errors.horas = "Um mês tem no máximo " + MAX_MONTH_HOURS + " horas. Revise o valor.";
      }
      return errors;
    },

    compute({ price, mode, hourly, income, monthHours }) {
      const wage = mode === "mes" ? Calc.hourlyFromMonthly(income, monthHours) : hourly;
      const hours = Calc.hoursNeeded(price, wage);
      return {
        price,
        wage,
        hours,
        workdays: hours / WORKDAY_HOURS,
        shareOfMonth: mode === "mes" ? (hours / monthHours) * 100 : null,
      };
    },
  };

  /* ---------- Formatação pt-BR ---------- */
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const num1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  const num0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

  function formatHours(h) {
    const totalMin = Math.round(h * 60);
    if (totalMin < 1) return "menos de 1 min";
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    if (hh === 0) return mm + " min";
    if (mm === 0) return num0.format(hh) + " h";
    return num0.format(hh) + " h " + mm + " min";
  }

  function hoursSentence(h) {
    const totalMin = Math.round(h * 60);
    if (totalMin < 1) return "menos de 1 minuto";
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    const hPart = hh === 1 ? "1 hora" : num0.format(hh) + " horas";
    const mPart = mm === 1 ? "1 minuto" : mm + " minutos";
    if (hh === 0) return mPart;
    return mm === 0 ? hPart : hPart + " e " + mPart;
  }

  function formatWorkdays(d) {
    if (d < 0.1) return "menos de 0,1 jornada";
    const text = num1.format(d);
    return text + (text === "1" ? " jornada" : " jornadas");
  }

  /* ---------- Calculadora (UI) ---------- */
  function initCalculator() {
    const form = document.getElementById("calc-form");
    if (!form) return;

    const $ = (id) => document.getElementById(id);
    const els = {
      preco: $("preco"), hora: $("salario-hora"),
      renda: $("renda-mensal"), horas: $("horas-mes"),
      grupoHora: $("grupo-hora"), grupoMes: $("grupo-mes"),
      vazio: $("resultado-vazio"), resultado: $("resultado"),
      submit: form.querySelector('button[type="submit"]'),
    };
    const errorEls = { preco: $("preco-erro"), hora: $("hora-erro"), renda: $("renda-erro"), horas: $("horas-erro") };
    const inputFor = { preco: els.preco, hora: els.hora, renda: els.renda, horas: els.horas };

    let hasResult = false;
    const mode = () => form.querySelector('input[name="modo"]:checked').value;

    function readValues() {
      return {
        mode: mode(),
        price: Calc.parseNumber(els.preco.value),
        hourly: Calc.parseNumber(els.hora.value),
        income: Calc.parseNumber(els.renda.value),
        monthHours: Calc.parseNumber(els.horas.value),
      };
    }

    function clearErrors() {
      Object.keys(errorEls).forEach((k) => {
        errorEls[k].hidden = true;
        errorEls[k].textContent = "";
        inputFor[k].removeAttribute("aria-invalid");
      });
    }

    function showErrors(errors) {
      clearErrors();
      let first = null;
      ["preco", "hora", "renda", "horas"].forEach((k) => {
        if (errors[k]) {
          errorEls[k].textContent = errors[k];
          errorEls[k].hidden = false;
          inputFor[k].setAttribute("aria-invalid", "true");
          if (!first) first = inputFor[k];
        }
      });
      if (first) first.focus();
    }

    function render(values, animate) {
      const r = Calc.compute(values);
      $("res-horas").textContent = formatHours(r.hours);
      $("res-frase").textContent = "Esta compra representa " + hoursSentence(r.hours) + " do seu trabalho.";
      $("res-preco").textContent = brl.format(r.price);
      $("res-hora").textContent = brl.format(r.wage);
      $("res-dias").textContent = formatWorkdays(r.workdays);
      const shareBox = $("res-share-box");
      if (r.shareOfMonth === null) {
        shareBox.hidden = true;
      } else {
        shareBox.hidden = false;
        $("res-share").textContent = num1.format(r.shareOfMonth) + "%";
      }
      $("res-nota").textContent =
        "Jornada de referência: " + WORKDAY_HOURS + " h por dia. São horas de trabalho, não dias corridos: " +
        "elas se espalham pelos dias em que você trabalha. É uma estimativa, sem impostos, descontos ou outras despesas.";

      els.vazio.hidden = true;
      els.resultado.hidden = false;
      hasResult = true;
      if (animate) {
        els.resultado.classList.remove("pop");
        void els.resultado.offsetWidth; // reinicia a animação
        els.resultado.classList.add("pop");
      }
    }

    function setMode() {
      const isMonth = mode() === "mes";
      els.grupoHora.hidden = isMonth;
      els.grupoMes.hidden = !isMonth;
      clearErrors();
      if (hasResult) tryLiveUpdate();
    }

    function tryLiveUpdate() {
      const values = readValues();
      if (Object.keys(Calc.validate(values)).length === 0) {
        clearErrors();
        render(values, false);
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const values = readValues();
      const errors = Calc.validate(values);
      if (Object.keys(errors).length) {
        showErrors(errors);
        return;
      }
      clearErrors();
      els.submit.classList.add("is-loading");
      els.submit.disabled = true;
      setTimeout(function () {
        els.submit.classList.remove("is-loading");
        els.submit.disabled = false;
        render(values, true);
        if (window.matchMedia("(max-width: 899px)").matches) {
          els.resultado.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 300);
    });

    form.addEventListener("reset", function () {
      // O reset nativo limpa os valores; ajustamos o restante em seguida.
      setTimeout(function () {
        clearErrors();
        hasResult = false;
        els.resultado.hidden = true;
        els.vazio.hidden = false;
        setMode();
      }, 0);
    });

    form.querySelectorAll('input[name="modo"]').forEach((r) => r.addEventListener("change", setMode));
    form.addEventListener("input", function (e) {
      if (e.target.type === "text" && hasResult) tryLiveUpdate();
    });
  }

  /* ---------- Menu e navegação ---------- */
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.getElementById("menu-principal");
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".sr-only").textContent = open ? "Fechar menu" : "Abrir menu";
      menu.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Destaca no menu a seção visível.
    const links = Array.from(menu.querySelectorAll("a"));
    const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && map.has(en.target.id)) {
            links.forEach((a) => a.classList.remove("is-current"));
            const a = map.get(en.target.id);
            a.classList.add("is-current");
            a.setAttribute("aria-current", "true");
            links.filter((l) => l !== a).forEach((l) => l.removeAttribute("aria-current"));
          }
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    }
  }

  /* ==========================================================
     NOVAS SEÇÕES: Problemas · Quiz · Simulador · Custo por uso · Compromisso
     Nada é salvo nem enviado: todo o estado fica na memória da página.
     ========================================================== */

  /* ---------- Dados (edite aqui para mudar o conteúdo) ---------- */

  // Fonte de todos os números dos cartões.
  const FONTE_ONU = {
    nome: "ONU – Objetivo 12",
    url: "https://www.un.org/sustainabledevelopment/sustainable-consumption-production/",
  };

  // Cada "icone" é uma lista de caminhos SVG (viewBox 48×48), desenhados com traço.
  // "destaque" é o número grande que conta do zero ao abrir o cartão (null = sem número).
  const PROBLEMAS = [
    {
      id: "alimentos",
      titulo: "Desperdício de alimentos",
      resumo: "Comida boa indo para o lixo.",
      icone: ["M8 22h32a16 16 0 0 1-32 0z", "M18 14c-2-3 2-5 0-8", "M30 14c-2-3 2-5 0-8"],
      destaque: { prefixo: "", valor: 1.05, casas: 2, sufixo: " bilhão" },
      dado: "de toneladas de alimentos são desperdiçadas por ano, cerca de 19% de toda a comida disponível no mundo.",
      porque: "Enquanto milhões de pessoas passam fome, a comida jogada fora também desperdiça a água, a energia e o trabalho usados para produzi-la.",
      acao: "planejar as compras e aproveitar as sobras antes que estraguem",
    },
    {
      id: "eletronicos",
      titulo: "Lixo eletrônico",
      resumo: "Celulares e computadores trocados cedo demais.",
      icone: ["M16 6h16a3 3 0 0 1 3 3v30a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z", "M21 36h6", "M20 16l8 8M28 16l-8 8"],
      destaque: { prefixo: "", valor: 65, casas: 0, sufixo: " milhões" },
      dado: "de toneladas de lixo eletrônico foram geradas no mundo em 2023.",
      porque: "Eletrônicos têm metais pesados que contaminam o solo e a água quando vão para o lixo comum.",
      acao: "consertar antes de trocar e levar aparelhos velhos a um ponto de coleta",
    },
    {
      id: "plastico",
      titulo: "Plástico descartável",
      resumo: "Copos, canudos e sacolas usados por poucos minutos.",
      icone: ["M12 14h24l-3 26H15z", "M10 14h28", "M28 14l4-9h5"],
      destaque: null,
      dado: "Segundo a ONU, os plásticos de uso único estão entre os principais poluentes dos oceanos.",
      porque: "Um copo é usado por minutos, mas o plástico pode levar séculos para se decompor.",
      acao: "andar com garrafa, copo e sacola reutilizáveis",
    },
    {
      id: "moda",
      titulo: "Moda descartável",
      resumo: "Roupa barata usada poucas vezes.",
      icone: ["M18 8L6 15l4 8 5-3v21h18V20l5 3 4-8-12-7c-1 4-4 5-6 5s-5-1-6-5z"],
      destaque: { prefixo: "Cerca de ", valor: 10, casas: 0, sufixo: " mil" },
      dado: "litros de água são necessários para produzir uma única calça jeans, segundo a ONU.",
      porque: "Comprar roupa por impulso multiplica o gasto de água e de energia e o volume de tecido descartado.",
      acao: "usar mais as roupas que já tenho e preferir brechó ou troca",
    },
    {
      id: "planeta",
      titulo: "Consumo além do que o planeta aguenta",
      resumo: "Comprar mais do que precisamos.",
      icone: ["M24 8a16 16 0 1 0 0 32a16 16 0 0 0 0-32z", "M8 24h32", "M24 8c-6 5-6 27 0 32", "M24 8c6 5 6 27 0 32"],
      destaque: { prefixo: "Se a população chegar a ", valor: 9.8, casas: 1, sufixo: " bilhões" },
      dado: "de pessoas em 2050, seriam necessários quase três planetas para manter o estilo de vida atual.",
      porque: "Os recursos naturais são limitados, e cada compra desnecessária consome parte deles.",
      acao: "esperar 48 horas antes de qualquer compra por impulso",
    },
  ];

  // "resposta": true = Verdadeiro, false = Falso.
  const PERGUNTAS = [
    {
      afirmacao: "Reciclar é a melhor coisa que podemos fazer pelo meio ambiente.",
      resposta: false,
      explicacao: "Reciclar é bom, mas reduzir e reutilizar vêm antes. O melhor lixo é o que nem chega a existir.",
    },
    {
      afirmacao: "Cerca de 19% da comida disponível no mundo é desperdiçada.",
      resposta: true,
      explicacao: "Segundo a ONU, são 1,05 bilhão de toneladas por ano.",
    },
    {
      afirmacao: "Celular velho pode ir no lixo comum sem problema.",
      resposta: false,
      explicacao: "Eletrônicos têm metais pesados e devem ir para pontos de coleta específicos.",
    },
    {
      afirmacao: "Comprar no comércio local também ajuda o ODS 12.",
      resposta: true,
      explicacao: "A ONU recomenda apoiar negócios locais e sustentáveis.",
    },
    {
      afirmacao: "O ODS 12 é responsabilidade só dos governos e das empresas.",
      resposta: false,
      explicacao: "As escolhas de cada pessoa também contam.",
    },
  ];

  // Simulador: quantas vezes o valor se repete em 1 ano e como ele é lido por leitores de tela.
  const CONTROLES_SIMULADOR = [
    { chave: "copos", fator: 365, unidade: "copos por dia" },
    { chave: "sacolas", fator: 52, unidade: "sacolas por semana" },
    { chave: "garrafas", fator: 52, unidade: "garrafas por semana" },
  ];

  const LIMITE_CUSTO_POR_USO = 5; // R$ por uso: referência para a conversa, não uma regra

  /* ---------- Lógica pura (testável em Node) ---------- */
  const Ods = {
    /** Totais por ano a partir dos valores dos controles. */
    totaisAnuais(valores) {
      const totais = { total: 0 };
      CONTROLES_SIMULADOR.forEach(function (c) {
        const v = Number(valores[c.chave]) || 0;
        totais[c.chave] = v * c.fator;
        totais.total += totais[c.chave];
      });
      return totais;
    },

    fraseSimulador(total) {
      if (total === 0) return "Parabéns! Você já vive sem descartáveis.";
      const itens = total === 1 ? "1 item" : num0.format(total) + " itens";
      return "Com uma garrafa, um copo e uma sacola reutilizáveis, você evitaria " + itens + " de plástico no lixo em 1 ano.";
    },

    /** Recebe números já convertidos (NaN se inválido). Retorna { preco, usos } com mensagens. */
    validarCustoPorUso(preco, usos) {
      const erros = {};
      if (Number.isNaN(preco)) erros.preco = "Informe o preço da roupa, por exemplo 120,00.";
      else if (preco < 0) erros.preco = "O preço não pode ser negativo.";
      else if (preco === 0) erros.preco = "O preço precisa ser maior que zero.";
      else if (preco > 1e9) erros.preco = "Esse valor é alto demais. Informe um preço menor.";

      if (Number.isNaN(usos)) erros.usos = "Informe quantas vezes, por exemplo 30.";
      else if (usos < 0) erros.usos = "O número de usos não pode ser negativo.";
      else if (!Number.isInteger(usos)) erros.usos = "Use um número inteiro de usos, por exemplo 30.";
      else if (usos < 1) erros.usos = "Informe pelo menos 1 uso para a conta fazer sentido.";
      else if (usos > 100000) erros.usos = "Esse número de usos é alto demais. Revise o valor.";
      return erros;
    },

    custoPorUso(preco, usos) {
      return preco / usos;
    },

    mensagemCustoPorUso(custo) {
      return custo <= LIMITE_CUSTO_POR_USO
        ? "Essa peça está valendo a pena!"
        : "Que tal usar mais vezes antes de comprar outra?";
    },

    mensagemQuiz(acertos, total) {
      if (acertos === total) return "Mandou muito! Você entende de consumo consciente.";
      if (acertos >= 3) return "Muito bom! Dá para ir ainda mais longe.";
      return "Tudo bem, agora você já sabe mais do que antes.";
    },

    capitalizar(texto) {
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    },

    textoCompromisso(acoes, link) {
      const linhas = acoes.map(function (a) { return "- " + Ods.capitalizar(a); });
      return "Meu compromisso com o ODS 12:\n" + linhas.join("\n") + "\n\nFaça o seu também: " + link;
    },
  };

  /* ---------- Utilitários de interface ---------- */
  const NS_SVG = "http://www.w3.org/2000/svg";

  /** Cria um elemento com classe e texto (sempre via textContent, nunca innerHTML). */
  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function criarIcone(caminhos) {
    const svg = document.createElementNS(NS_SVG, "svg");
    svg.setAttribute("class", "problem-icon");
    svg.setAttribute("viewBox", "0 0 48 48");
    svg.setAttribute("aria-hidden", "true");
    caminhos.forEach(function (d) {
      const p = document.createElementNS(NS_SVG, "path");
      p.setAttribute("d", d);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "currentColor");
      p.setAttribute("stroke-width", "3");
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke-linejoin", "round");
      svg.appendChild(p);
    });
    return svg;
  }

  function reduzMovimento() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function formatarDestaque(d, valor) {
    const fmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: d.casas, maximumFractionDigits: d.casas });
    return fmt.format(valor) + d.sufixo;
  }

  /** Faz o número "contar" do zero até o valor. Com movimento reduzido, mostra direto. */
  function contarAteValor(el, d) {
    if (reduzMovimento()) {
      el.textContent = formatarDestaque(d, d.valor);
      return;
    }
    const duracao = 900;
    const inicio = performance.now();
    function passo(agora) {
      const p = Math.min(1, (agora - inicio) / duracao);
      const suave = 1 - Math.pow(1 - p, 3);
      el.textContent = formatarDestaque(d, d.valor * suave);
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  /** Reinicia uma microanimação CSS (classe "bump") num elemento. */
  function pulsar(el) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  /* ---------- Seção A: Problemas do ODS 12 ---------- */
  function initProblemas(aoMudarAcoes) {
    const lista = document.getElementById("problemas-lista");
    if (!lista) return;

    const marcadas = new Set(); // ids das ações marcadas (só na memória)

    function acoesMarcadas() {
      return PROBLEMAS.filter(function (p) { return marcadas.has(p.id); })
        .map(function (p) { return p.acao; });
    }

    PROBLEMAS.forEach(function (p) {
      const painelId = "problema-painel-" + p.id;
      const item = criar("li", "problem");

      // Cabeçalho: botão que abre e fecha o cartão.
      const titulo = criar("h3", "problem-heading");
      const botao = criar("button", "problem-toggle");
      botao.type = "button";
      botao.id = "problema-btn-" + p.id;
      botao.setAttribute("aria-expanded", "false");
      botao.setAttribute("aria-controls", painelId);

      const textos = criar("span", "problem-text");
      textos.appendChild(criar("span", "problem-title", p.titulo));
      textos.appendChild(criar("span", "problem-summary", p.resumo));
      const seta = criar("span", "problem-chevron");
      seta.setAttribute("aria-hidden", "true");
      botao.append(criarIcone(p.icone), textos, seta);
      titulo.appendChild(botao);

      // Painel: dado, fonte, "por que é um problema" e a caixa de seleção.
      const painel = criar("div", "problem-panel");
      painel.id = painelId;
      const interno = criar("div", "problem-panel-inner");
      const corpo = criar("div", "problem-body");

      const dado = criar("p", "problem-stat");
      let numeroEl = null;
      if (p.destaque) {
        if (p.destaque.prefixo) dado.appendChild(criar("span", "stat-pre", p.destaque.prefixo));
        numeroEl = criar("span", "stat-num", formatarDestaque(p.destaque, p.destaque.valor));
        numeroEl.setAttribute("aria-hidden", "true"); // evita ler números intermediários
        dado.appendChild(numeroEl);
        dado.appendChild(criar("span", "sr-only", formatarDestaque(p.destaque, p.destaque.valor) + " "));
      }
      dado.appendChild(criar("span", "stat-text", p.dado));

      const fonte = criar("p", "problem-source");
      fonte.append("Fonte: ");
      const link = criar("a", null, FONTE_ONU.nome);
      link.href = FONTE_ONU.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      fonte.appendChild(link);

      const porque = criar("p", "problem-why");
      porque.appendChild(criar("strong", null, "Por que é um problema"));
      porque.append(p.porque);

      const rotulo = criar("label", "pledge");
      const caixa = document.createElement("input");
      caixa.type = "checkbox";
      caixa.id = "compromisso-" + p.id;
      const textoCaixa = criar("span", "pledge-text");
      textoCaixa.append("Vou fazer isso: ", criar("strong", null, p.acao));
      rotulo.append(caixa, textoCaixa);

      corpo.append(dado, fonte, porque, rotulo);
      interno.appendChild(corpo);
      painel.appendChild(interno);
      item.append(titulo, painel);
      lista.appendChild(item);

      // Abrir e fechar (aria-expanded + classe para a transição).
      let jaContou = false;
      botao.addEventListener("click", function () {
        const abrir = botao.getAttribute("aria-expanded") !== "true";
        botao.setAttribute("aria-expanded", String(abrir));
        item.classList.toggle("is-open", abrir);
        if (abrir && numeroEl && !jaContou) {
          jaContou = true;
          contarAteValor(numeroEl, p.destaque);
        }
      });

      // Marcar a ação atualiza a seção "Meu compromisso".
      caixa.addEventListener("change", function () {
        if (caixa.checked) marcadas.add(p.id);
        else marcadas.delete(p.id);
        rotulo.classList.toggle("is-checked", caixa.checked);
        item.classList.toggle("is-done", caixa.checked);
        aoMudarAcoes(acoesMarcadas());
      });
    });
  }

  /* ---------- Seção B: Quiz "Verdadeiro ou falso?" ---------- */
  function initQuiz() {
    const card = document.getElementById("quiz-card");
    if (!card) return;
    const $ = (id) => document.getElementById(id);
    const e = {
      contador: $("quiz-contador"), progresso: $("quiz-progresso"), barra: $("quiz-barra"),
      area: $("quiz-pergunta-area"), enunciado: $("quiz-enunciado"),
      verdadeiro: $("quiz-verdadeiro"), falso: $("quiz-falso"),
      feedback: $("quiz-feedback"), proxima: $("quiz-proxima"),
      final: $("quiz-final"), finalTitulo: $("quiz-final-titulo"),
      placar: $("quiz-placar"), mensagem: $("quiz-mensagem"), refazer: $("quiz-refazer"),
    };
    const total = PERGUNTAS.length;
    let indice = 0;
    let acertos = 0;
    let respondida = false;

    function progresso(respondidas) {
      e.progresso.setAttribute("aria-valuemax", String(total));
      e.progresso.setAttribute("aria-valuenow", String(respondidas));
      e.barra.style.transform = "scaleX(" + respondidas / total + ")";
    }

    function mostrarPergunta() {
      respondida = false;
      e.contador.textContent = "Pergunta " + (indice + 1) + " de " + total;
      e.enunciado.textContent = PERGUNTAS[indice].afirmacao;
      [e.verdadeiro, e.falso].forEach(function (b) {
        b.disabled = false;
        b.classList.remove("is-correct", "is-wrong");
      });
      e.feedback.hidden = true;
      e.feedback.className = "quiz-feedback";
      e.feedback.replaceChildren();
      e.proxima.hidden = true;
    }

    function responder(escolha) {
      if (respondida) return;
      respondida = true;
      const q = PERGUNTAS[indice];
      const acertou = escolha === q.resposta;
      if (acertou) acertos += 1;

      e.verdadeiro.disabled = true;
      e.falso.disabled = true;
      (q.resposta ? e.verdadeiro : e.falso).classList.add("is-correct");
      if (!acertou) (escolha ? e.verdadeiro : e.falso).classList.add("is-wrong");

      e.feedback.className = "quiz-feedback " + (acertou ? "is-right" : "is-miss");
      e.feedback.replaceChildren(
        criar("strong", null, acertou ? "Acertou!" : "Não foi dessa vez."),
        criar("span", null, " A resposta é " + (q.resposta ? "Verdadeiro" : "Falso") + ". " + q.explicacao)
      );
      e.feedback.hidden = false;
      progresso(indice + 1);
      e.proxima.hidden = false;
      e.feedback.focus(); // leitores de tela leem o resultado; o botão "Próxima" é o próximo foco
    }

    function mostrarFinal() {
      e.area.hidden = true;
      e.final.hidden = false;
      e.contador.textContent = "Quiz concluído";
      e.placar.textContent = "Você acertou " + acertos + " de " + total + ".";
      e.mensagem.textContent = Ods.mensagemQuiz(acertos, total);
      e.finalTitulo.focus();
    }

    e.verdadeiro.addEventListener("click", function () { responder(true); });
    e.falso.addEventListener("click", function () { responder(false); });
    e.proxima.addEventListener("click", function () {
      indice += 1;
      if (indice >= total) {
        mostrarFinal();
      } else {
        mostrarPergunta();
        e.enunciado.focus();
      }
    });
    e.refazer.addEventListener("click", function () {
      indice = 0;
      acertos = 0;
      e.final.hidden = true;
      e.area.hidden = false;
      progresso(0);
      mostrarPergunta();
      e.enunciado.focus();
    });

    progresso(0);
    mostrarPergunta();
  }

  /* ---------- Seção C: Simulador "Quanto descartável você usa?" ---------- */
  function initSimulador() {
    const frase = document.getElementById("sim-frase");
    if (!frase) return;
    const itens = CONTROLES_SIMULADOR.map(function (c) {
      return {
        cfg: c,
        input: document.getElementById("sim-" + c.chave),
        valor: document.getElementById("sim-" + c.chave + "-valor"),
        total: document.getElementById("sim-" + c.chave + "-total"),
      };
    });

    function atualizar(animar) {
      const valores = {};
      itens.forEach(function (i) { valores[i.cfg.chave] = Number(i.input.value); });
      const t = Ods.totaisAnuais(valores);

      itens.forEach(function (i) {
        const v = valores[i.cfg.chave];
        const min = Number(i.input.min);
        const max = Number(i.input.max);
        i.valor.textContent = num0.format(v);
        i.input.setAttribute("aria-valuetext", num0.format(v) + " " + i.cfg.unidade);
        i.input.style.setProperty("--fill", ((v - min) / (max - min)) * 100 + "%");

        const texto = num0.format(t[i.cfg.chave]);
        if (i.total.textContent !== texto) {
          i.total.textContent = texto;
          if (animar) pulsar(i.total);
        }
      });
      frase.textContent = Ods.fraseSimulador(t.total);
    }

    itens.forEach(function (i) {
      i.input.addEventListener("input", function () { atualizar(true); });
    });
    atualizar(false);
  }

  /* ---------- Seção D: Custo por uso ---------- */
  function initCustoPorUso() {
    const precoEl = document.getElementById("cpu-preco");
    if (!precoEl) return;
    const $ = (id) => document.getElementById(id);
    const usosEl = $("cpu-usos");
    const erroPreco = $("cpu-preco-erro");
    const erroUsos = $("cpu-usos-erro");
    const vazio = $("cpu-vazio");
    const conteudo = $("cpu-conteudo");

    /** Lê o valor por hora informado na calculadora principal (sem alterá-la). */
    function valorHoraDaCalculadora() {
      const modo = document.querySelector('input[name="modo"]:checked');
      if (!modo) return null;
      let v;
      if (modo.value === "hora") {
        v = Calc.parseNumber($("salario-hora").value);
      } else {
        const renda = Calc.parseNumber($("renda-mensal").value);
        const horas = Calc.parseNumber($("horas-mes").value);
        v = horas > MAX_MONTH_HOURS ? NaN : Calc.hourlyFromMonthly(renda, horas);
      }
      return Number.isFinite(v) && v > 0 ? v : null;
    }

    function mostrarErro(campo, erroEl, mensagem) {
      campo.setAttribute("aria-invalid", "true");
      erroEl.textContent = mensagem;
      erroEl.hidden = false;
    }

    function limparErros() {
      [[precoEl, erroPreco], [usosEl, erroUsos]].forEach(function (par) {
        par[0].removeAttribute("aria-invalid");
        par[1].textContent = "";
        par[1].hidden = true;
      });
    }

    function atualizar() {
      limparErros();
      const textoPreco = precoEl.value.trim();
      const textoUsos = usosEl.value.trim();
      const preco = Calc.parseNumber(textoPreco);
      const usos = Calc.parseNumber(textoUsos);
      const erros = Ods.validarCustoPorUso(preco, usos);

      // Só reclama de campo que a pessoa já começou a preencher.
      if (textoPreco !== "" && erros.preco) mostrarErro(precoEl, erroPreco, erros.preco);
      if (textoUsos !== "" && erros.usos) mostrarErro(usosEl, erroUsos, erros.usos);

      if (textoPreco === "" || textoUsos === "" || erros.preco || erros.usos) {
        vazio.hidden = false;
        conteudo.hidden = true;
        return;
      }

      const custo = Ods.custoPorUso(preco, usos);
      $("cpu-valor").textContent = brl.format(custo) + " por uso";
      $("cpu-conta").textContent = brl.format(preco) + " ÷ " + num0.format(usos) + (usos === 1 ? " uso" : " usos");
      $("cpu-mensagem").textContent = Ods.mensagemCustoPorUso(custo);

      const trabalho = $("cpu-trabalho");
      const hora = valorHoraDaCalculadora();
      if (hora) {
        trabalho.textContent = "Isso equivale a " + formatHours(custo / hora) + " do seu trabalho a cada uso.";
      } else {
        const link = criar("a", null, "calculadora");
        link.href = "#calculadora";
        trabalho.replaceChildren("Informe seu valor por hora na ", link, " para ver também em tempo de trabalho.");
      }
      vazio.hidden = true;
      conteudo.hidden = false;
    }

    precoEl.addEventListener("input", atualizar);
    usosEl.addEventListener("input", atualizar);

    // Se a pessoa mexer na calculadora, o tempo de trabalho acompanha.
    const calc = document.getElementById("calc-form");
    if (calc) {
      calc.addEventListener("input", atualizar);
      calc.addEventListener("change", atualizar);
      calc.addEventListener("reset", function () { setTimeout(atualizar, 0); });
    }
  }

  /* ---------- Seção E: Meu compromisso ---------- */
  function initCompromisso() {
    const botao = document.getElementById("compromisso-copiar");
    if (!botao) return function () {};
    const vazio = document.getElementById("compromisso-vazio");
    const conteudo = document.getElementById("compromisso-conteudo");
    const lista = document.getElementById("compromisso-lista");
    const status = document.getElementById("compromisso-status");
    let acoes = [];

    /** Endereço do site sem #âncora nem parâmetros. */
    function linkDoSite() {
      if (location.protocol === "file:") return location.href.split("#")[0];
      return location.protocol + "//" + location.host + location.pathname;
    }

    function avisar(texto, tipo) {
      status.textContent = texto;
      status.className = "pledge-status" + (tipo ? " is-" + tipo : "");
    }

    botao.addEventListener("click", async function () {
      if (acoes.length === 0) return;
      try {
        await navigator.clipboard.writeText(Ods.textoCompromisso(acoes, linkDoSite()));
        avisar("Copiado! Agora é só colar no WhatsApp ou nas redes.", "ok");
      } catch (erro) {
        avisar("Não deu para copiar automaticamente. Selecione o texto da lista acima e copie.", "erro");
      }
    });

    // Chamada pela Seção A sempre que uma ação é marcada ou desmarcada.
    return function atualizar(novasAcoes) {
      acoes = novasAcoes;
      vazio.hidden = acoes.length > 0;
      conteudo.hidden = acoes.length === 0;
      botao.disabled = acoes.length === 0;
      lista.replaceChildren.apply(lista, acoes.map(function (a) { return criar("li", null, Ods.capitalizar(a)); }));
      avisar("", "");
    };
  }

  /* ---------- Início ---------- */
  if (typeof document !== "undefined") {
    const year = document.getElementById("ano");
    if (year) year.textContent = new Date().getFullYear();
    initNav();
    initCalculator();

    // Novas seções.
    const aoMudarAcoes = initCompromisso();
    initProblemas(aoMudarAcoes);
    initQuiz();
    initSimulador();
    initCustoPorUso();
  }

  // Exposto para testes em Node.
  if (typeof module !== "undefined" && module.exports) module.exports = { Calc, Ods, PROBLEMAS, PERGUNTAS, formatHours, hoursSentence };
  else window.Calc = Calc;
})();
