# Preço e Tempo — Consumo Consciente (ODS 12)

Projeto acadêmico de **Matheus Willian Miguel Bertuzo** (RGM 44071060) sobre o **ODS 12 da ONU: Consumo e Produção Responsáveis**.

O site transforma o preço de uma compra em **horas de trabalho**, para ajudar a pensar antes de comprar por impulso.

🔗 **Acesse o site:** https://matheuswillian-dev.github.io/Eixo-Tematico-PIT-I-Exatas-e-Informatica-TurEsp_02_AV/

---

## Como executar

Não há dependências nem build. Abra o `index.html` com duplo clique em qualquer navegador moderno.

Opcional, com servidor local:

```bash
python -m http.server 8000
```

Depois acesse http://localhost:8000.

> As fontes vêm do Google Fonts. Sem internet, o site usa as fontes do sistema.

## Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Estrutura semântica e todo o conteúdo em português do Brasil |
| `style.css` | Design mobile-first, responsivo, com foco visível e `prefers-reduced-motion` |
| `script.js` | Calculadora (lógica pura + interface), menu móvel e destaque de seção, mais os dados e a lógica de problemas, quiz, simuladores e compromisso |

## Funcionalidades e objetivo educativo

| Recurso | Como apoia o projeto |
| --- | --- |
| Calculadora de compras | Converte preço em horas de trabalho (preço ÷ valor por hora; ou renda mensal ÷ horas no mês). Valida entradas, formata em R$, mostra jornadas de 8 h e % das horas do mês. Incentiva a pausa antes de comprar. |
| Dicas sustentáveis | Sete cartões com explicação, ação imediata e detalhe expansível. |
| Problemas do ODS 12 | Cinco cartões que abrem, com dado da ONU, fonte, "por que é um problema" e uma ação para marcar. |
| Quiz "Verdadeiro ou falso?" | Cinco afirmações, uma por vez, com barra de progresso, explicação imediata e placar final. |
| Simulador de descartáveis | Três controles (copos, sacolas, garrafas) que mostram a contagem de itens por ano, em tempo real. |
| Custo por uso | Preço da roupa ÷ número de usos, com mensagem curta e o equivalente em tempo de trabalho (usa o valor por hora da calculadora). |
| Meu compromisso | Reúne as ações marcadas e copia um texto pronto para compartilhar. |
| Sobre o ODS 12 | Explica o objetivo, por que importa e a responsabilidade compartilhada entre indivíduos, empresas e governos, com links para fontes oficiais da ONU. |
| Seção de impacto | Liga a calculadora ao consumo consciente, sem culpa. |
| Sobre o projeto | Dados do aluno e finalidade acadêmica. Nenhuma instituição foi inventada. |

## Publicar no GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em **Source**, escolha **Deploy from a branch**.
3. Selecione a branch `main` e a pasta `/ (root)` e clique em **Save**.
4. Aguarde 1 ou 2 minutos. O link do site aparece no topo da mesma página.

## Observações

- O "12" na seção ODS é uma ilustração própria, não o logotipo oficial. O site declara não ter vínculo com a ONU.
- Os números da seção "Os problemas que o ODS 12 quer resolver" vêm da ONU e aparecem com a fonte e o link em cada cartão ([ONU – Objetivo 12](https://www.un.org/sustainabledevelopment/sustainable-consumption-production/)). Nenhum outro dado estatístico foi incluído, e os valores de referência dos simuladores (como R$ 5 por uso) são apenas ilustrativos.
- Nada que a pessoa digita ou marca é salvo ou enviado: tudo fica na memória da página.
- O cálculo é uma estimativa educativa e ignora impostos, descontos e outras despesas.

## Fonte

- [ONU – Objetivo 12: Consumo e Produção Responsáveis](https://www.un.org/sustainabledevelopment/sustainable-consumption-production/)