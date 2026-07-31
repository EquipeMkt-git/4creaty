import { useState } from "react";
import { useProjeto } from "./store/useProjeto";
import { PreviewSlide } from "./components/PreviewSlide";
import { FORMATOS, type FormatId } from "./model/schema";

const FORMATOS_UI: FormatId[] = ["4:5", "1:1", "9:16", "1.91:1"];
const corEstado: Record<string, string> = {
  pronto: "var(--ok)", gerando: "var(--alerta)", erro: "var(--erro)"
};

function IconeCamadas() {
  return (
    <svg className="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function IconeSafe() {
  return (
    <svg className="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function App() {
  const doc = useProjeto((s) => s.doc);
  const postId = useProjeto((s) => s.postId);
  const slideId = useProjeto((s) => s.slideId);
  const trocarFormato = useProjeto((s) => s.trocarFormato);
  const selecionarPost = useProjeto((s) => s.selecionarPost);
  const selecionarSlide = useProjeto((s) => s.selecionarSlide);

  const [safe, setSafe] = useState(true);

  const posts = doc.projetos.flatMap((pr) => pr.posts);
  const projeto = doc.projetos.find((pr) => pr.posts.some((p) => p.id === postId)) ?? doc.projetos[0];
  const post = posts.find((p) => p.id === postId) ?? posts[0];
  const brandKit = projeto?.brandKits.find((b) => b.id === post?.brandKitId) ?? projeto?.brandKits[0];
  const slide = post?.slides.find((s) => s.id === slideId) ?? post?.slides[0];

  return (
    <div className="studio">
      <header className="topo">
        <div className="marca">4<span>creaty</span> Studio</div>
        <div className="cliente">· {projeto?.cliente ?? "—"}</div>
        <div className="espaco" />
        <button>Autosave ativo</button>
      </header>

      {/* Painel esquerdo — posts + Brand Kit */}
      <aside className="painel esq">
        <div className="secao">
          <div className="secao-titulo">Posts</div>
          {posts.map((p) => (
            <div
              key={p.id}
              className={"item-post" + (p.id === post?.id ? " ativo" : "")}
              onClick={() => selecionarPost(p.id)}
            >
              {p.titulo}
              <div className="meta">{p.tipo} · {p.slides.length} slides · {p.status}</div>
            </div>
          ))}
        </div>

        <div className="secao">
          <div className="secao-titulo">Brand Kit · {brandKit?.nome}</div>
          <div className="swatches">
            {brandKit && Object.entries(brandKit.cores)
              .filter(([, v]) => String(v).startsWith("#"))
              .map(([k, v]) => <div key={k} className="swatch" title={k} style={{ background: String(v) }} />)}
          </div>
        </div>
      </aside>

      {/* Centro — formatos, preview, miniaturas */}
      <main className="centro">
        <div className="barra-centro">
          {FORMATOS_UI.map((f) => (
            <button
              key={f}
              className={"chip" + (post?.formato.id === f ? " ativo" : "")}
              onClick={() => trocarFormato(f)}
              title={FORMATOS[f as Exclude<FormatId, "custom">].uso}
            >
              {FORMATOS[f as Exclude<FormatId, "custom">].nome} {f}
            </button>
          ))}
          <div className="espaco" style={{ flex: 1 }} />
          <button onClick={() => setSafe((v) => !v)} className={safe ? "chip ativo" : "chip"}>
            <IconeSafe /> Área segura
          </button>
        </div>

        <div className="palco">
          {slide && brandKit && post ? (
            <div className="moldura">
              <PreviewSlide
                slide={slide}
                brandKit={brandKit}
                formato={post.formato}
                alturaExibicao={Math.min(520, 900)}
                mostrarSafeArea={safe}
              />
            </div>
          ) : (
            <div className="vazio">Nenhum slide para exibir.</div>
          )}
        </div>

        <div className="tira">
          {post?.slides.map((s, i) => (
            <div
              key={s.id}
              className={"mini" + (s.id === slide?.id ? " ativo" : "")}
              onClick={() => selecionarSlide(s.id)}
              title={s.tipo}
            >
              <span className="num">{i + 1}</span>
              {brandKit && (
                <PreviewSlide slide={s} brandKit={brandKit} formato={post.formato} alturaExibicao={71} />
              )}
              <span className="estado" style={{ background: corEstado[s.estado] }} />
            </div>
          ))}
        </div>
        <div className="rodape-nota">
          Onda 0 · fundação. Preview por posição relativa (reflow entre formatos) e cores do Brand Kit.
          Edição no canvas Konva, gestão de slides e variações entram nas próximas ondas (ver PLANO.md).
        </div>
      </main>

      {/* Painel direito — propriedades */}
      <aside className="painel dir">
        <div className="secao-titulo"><IconeCamadas /> Propriedades</div>
        {slide && post ? (
          <>
            <div className="prop"><label>Slide</label><div className="valor">{slide.tipo}</div></div>
            <div className="prop"><label>Formato</label><div className="valor">{post.formato.nome} · {post.formato.largura}×{post.formato.altura}</div></div>
            <div className="prop"><label>Camadas</label><div className="valor">{slide.camadas.length}</div></div>
            <div className="prop"><label>Estado</label><div className="valor">{slide.estado}</div></div>
            <div className="secao-titulo" style={{ marginTop: 18 }}>Camadas</div>
            {slide.camadas.map((c) => (
              <div key={c.id} className="prop">
                <div className="valor">{c.nome} <span style={{ color: "var(--txt-2)" }}>· {c.tipo}</span></div>
              </div>
            ))}
          </>
        ) : <div className="vazio">Selecione um slide.</div>}
      </aside>
    </div>
  );
}
