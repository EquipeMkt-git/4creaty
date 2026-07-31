/**
 * 4creaty Studio · back-end (seed da Onda 0).
 * Existe para fixar a fronteira: chaves de API e trabalho pesado ficam aqui,
 * nunca no front (RT-02). As rotas de valor entram na Onda 4; por ora respondem
 * 501 para deixar o contrato explícito e o front poder integrar cedo.
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT ?? 8787;

/** Health check da API. */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, servico: "4creaty-studio", versao: "0.1.0", onda: 0 });
});

/** Proxy de busca de imagens — Freepik (RF-05). Chave lida do ambiente. */
app.get("/api/images/search", (_req, res) => {
  if (!process.env.FREEPIK_API_KEY) {
    return res.status(503).json({ ok: false, erro: "FREEPIK_API_KEY ausente no servidor" });
  }
  return res.status(501).json({ ok: false, erro: "não implementado (Onda 4)" });
});

/** Geração por IA — copy e imagem (RF-05, RF-10). Prompt enriquecido pelo Brand Kit. */
app.post("/api/ai/copy", (_req, res) => res.status(501).json({ ok: false, erro: "não implementado (Onda 4)" }));
app.post("/api/ai/image", (_req, res) => res.status(501).json({ ok: false, erro: "não implementado (Onda 4)" }));

/** Upscale/enhance — Magnific (RF-05). Aplicar antes do export final. */
app.post("/api/enhance", (_req, res) => res.status(501).json({ ok: false, erro: "não implementado (Onda 4)" }));

/** Export em massa server-side (RF-11) — vira job na fila (RT-03). */
app.post("/api/export", (_req, res) => res.status(501).json({ ok: false, erro: "não implementado (Onda 4)" }));

app.listen(PORT, () => {
  console.log(`4creaty Studio API on http://localhost:${PORT}`);
});
