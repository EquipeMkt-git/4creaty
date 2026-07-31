# 4creaty — app

Gerador de carrosséis da 4blue. O copy cola o texto com marcações simples, o app monta os cards no modelo validado do designer (estilo "Notas", Nunito, destaque amarelo) e exporta em PNG 4K. Roda 100% no navegador; o único serviço externo é uma planilha no Drive que guarda os carrosséis salvos.

Base de arte e formatação: trabalho do designer da 4blue (parser + renderer + estilos), mantido intacto. Sobre ela foram adicionados o shell sem emojis (ícones SVG) e a persistência no Drive.

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Shell do app (editor, preview, modais) |
| `styles.css` | Estilos do app e dos cards (modelo do designer) |
| `parser.js` | Texto marcado para dados estruturados |
| `renderer.js` | Dados para os cards em DOM |
| `app.js` | Controlador: editor para parser, renderer e download PNG |
| `storage.js` | Salvar/abrir carrosséis no Drive (via Apps Script) |
| `apps-script/Codigo.gs` | Web App que grava na planilha (o "banco") |

## Publicar no GitHub Pages

1. Coloque o conteúdo desta pasta `app/` na raiz do repositório publicado (ou aponte o Pages para ela).
2. No GitHub: Settings > Pages > Source = branch `main` (raiz). O site sobe em `https://SEU-USUARIO.github.io/SEU-REPO/`.
3. Sem build, sem npm. `html2canvas` e a fonte Nunito vêm por CDN.

Teste local: `python -m http.server` na pasta e abrir `http://localhost:8000` (abrir o `index.html` direto do disco também funciona para o gerador; o Salvar/Abrir exige a URL do Apps Script).

## Banco de dados no Drive (Apps Script + Sheets)

1. Crie uma planilha no Drive da 4blue e copie o ID da URL.
2. Em `script.new`, cole `apps-script/Codigo.gs`, preencha `SHEET_ID` e publique como App da Web (Executar como: você · Acesso: qualquer pessoa).
3. Copie a URL `/exec` e cole em `APPS_SCRIPT_URL` no topo de `storage.js`.
4. Pronto: os botões Salvar e Abrir passam a gravar e listar carrosséis na planilha.

O que é salvo na planilha: nome, autor, data e o texto do editor — um registro por carrossel, para reabrir e editar depois.

Imagens: além de baixar em PNG local, o botão **Publicar no Drive** envia os cards renderizados para a pasta `4creaty - Carrosseis` no Drive (uma subpasta por carrossel), formando a biblioteca de artes da equipe. Na primeira publicação o Google pede autorização de acesso ao Drive — é a conta da 4blue autorizando o próprio script.

## Sintaxe do texto

Separe cards com `#1`, `#2`… Primeiro card é a capa (fonte maior automática).

| Marcação | Resultado |
|---|---|
| `:blue` (junto ao `#N` ou `---`) | Card com fundo azul |
| `## Título` | Título de passo |
| `**texto**` | Parágrafo inteiro em negrito |
| `*texto*` | Negrito inline |
| `_texto_` | Itálico inline |
| `=texto=` | Destaque amarelo |
| `---` | Linha divisória |

Atalho: Ctrl+Enter (ou Cmd+Enter) gera o carrossel.
