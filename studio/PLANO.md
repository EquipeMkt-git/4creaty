# 4creaty Studio · plano de construção (SaaS)

Decisão (24/07/2026): caminho **SaaS completo**. Este diretório (`studio/`) é o produto v2 — estúdio de criação com editor próprio, IA e APIs pagas. O app v1 (raiz, CSV/Canva) fica congelado como ferramenta paralela.

## Stack fechada

| Camada | Escolha | Porquê |
|---|---|---|
| Frontend | React + Vite + TypeScript | Padrão, rápido, tipado |
| Canvas do editor | React-Konva (Konva) | Já traz transformer, camadas e export para imagem (RF-04) |
| Estado | Zustand | Simples, sem boilerplate |
| Persistência local (fase 1) | Dexie (IndexedDB) | Autosave e recuperação offline antes do banco |
| Estilo | CSS tokens (tema dark) | RF-06 por tokens, sem hardcode |
| Back-end | Node + Express + TypeScript | Proxy de APIs, fila de jobs, export server-side |
| Banco (fase back-end) | Postgres + Prisma | Multi-cliente, versões, biblioteca (RF-12, RT-04) |
| Fila de jobs | BullMQ + Redis | IA, upscale e export em massa fora da requisição (RT-03) |
| Storage de objetos | S3 compatível | Imagens e exports |
| Hospedagem | Frontend em Vercel/Netlify · API em host Node | Pages estático não serve SPA + API |

Chaves de Freepik, Magnific e IA vivem só no back-end (RT-02). O front nunca as toca.

## Ordem de execução

Mesmo com "tudo", a dependência é física: o modelo de dados (RT-01) e o Brand Kit (RF-07) sustentam todo o resto. Seguimos as ondas do backlog.

| Onda | Entrega | Requisitos | Depende de |
|---|---|---|---|
| 0 · Fundação | Modelo de dados, tokens dark, shell do app, scaffold front+back | RT-01, RF-06 | — |
| 1 · Base visual | Preview fiel, formatos e reflow, Brand Kit | RF-01, RF-03, RF-07 | Onda 0 |
| 2 · Controle da copy | Colar e importar copy, quantidade e variações, gestão de slides, cores | RF-13, RF-08, RF-10, RF-02, RF-09 | Onda 1 |
| 3 · Edição e persistência | Editor Konva, biblioteca, versões, autosave, tema aplicado | RF-04, RF-12 | Onda 2 |
| 4 · Escala e IA | Freepik/Magnific, IA de copy/imagem, export em massa, fila de jobs, banco | RF-05, RF-11, RT-02, RT-03, RT-04 | Onda 3 |

O editor (RF-04) vem depois da persistência (RF-12): editar o que não se salva não gera valor, e Brand Kit bem configurado absorve boa parte da edição manual antes disso.

## Estado atual (Onda 0, em andamento)

Entregue nesta sessão: modelo de dados (`src/model/`), tokens dark (`src/styles/tokens.css`), shell do frontend renderizando um post de exemplo pelo modelo, e seed do back-end com rotas stub. Falta rodar `npm install` e verificar o build — o ambiente de execução da sessão está indisponível, então a primeira instalação/rodada será na sua máquina (ou quando o sandbox voltar) e eu ajusto o que aparecer.

## Como rodar (após o scaffold)

Frontend: `cd studio && npm install && npm run dev`. Back-end: `cd studio/server && npm install && npm run dev`. Detalhes e variáveis em `server/.env.example`.
