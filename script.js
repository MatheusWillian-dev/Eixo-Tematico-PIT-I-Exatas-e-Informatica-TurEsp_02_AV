/* ==========================================================
   Preço e Tempo — ODS 12
   Módulos: Calc (lógica pura) · Calculadora (UI) · Menu · Checklist
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

  /* ---------- Início ---------- */
  if (typeof document !== "undefined") {
    const year = document.getElementById("ano");
    if (year) year.textContent = new Date().getFullYear();
    initNav();
    initCalculator();
  }

  // Exposto para testes em Node.
  if (typeof module !== "undefined" && module.exports) module.exports = { Calc, formatHours, hoursSentence };
  else window.Calc = Calc;
})();
