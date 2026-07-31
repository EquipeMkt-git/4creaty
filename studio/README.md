# 4creaty Studio (v2)

Estúdio de criação — editor próprio, IA e APIs. Substitui o fluxo CSV/Canva do v1 (raiz do projeto). Decisão, stack e ordem de ondas em `PLANO.md`.

## Rodar

Frontend:

```
cd studio
npm install
npm run dev
```

Back-end (opcional na Onda 0):

```
cd studio/server
npm install
cp .env.example .env   # preencher as chaves
npm run dev
```

## Estado

Onda 0 (fundação): modelo de dados versionado (`src/model/`), tema dark por tokens (`src/styles/tokens.css`), shell de 3 painéis com preview fiel renderizado pelo modelo (reflow por formato + cores do Brand Kit), e seed do back-end com as rotas de valor demarcadas. Próxima: Onda 1 (preview completo, formatos, Brand Kit editável).

Verificação de build ainda não rodada nesta sessão (ambiente de execução indisponível) — a primeira `npm install` valida o scaffold.
