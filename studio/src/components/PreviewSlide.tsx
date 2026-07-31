/**
 * Preview fiel do slide (RF-01, fundação).
 * Renderiza as camadas por posição RELATIVA (fração do artboard), o que dá o
 * reflow automático entre formatos (RF-03). Cores e fontes vêm do Brand Kit
 * (RF-07). Na Onda 3 este preview passa a ser o próprio canvas Konva editável.
 */
import type { CSSProperties } from "react";
import type { Slide, BrandKit, Formato, PapeisDeCor, EstiloTipografico } from "../model/schema";

interface Props {
  slide: Slide;
  brandKit: BrandKit;
  formato: Formato;
  alturaExibicao: number;
  mostrarSafeArea?: boolean;
}

function estiloPorPapel(bk: BrandKit, papel: string): EstiloTipografico {
  if (papel === "titulo") return bk.tipografia.titulo;
  if (papel === "subtitulo") return bk.tipografia.subtitulo;
  if (papel === "cta" || papel === "destaque") return bk.tipografia.subtitulo;
  return bk.tipografia.corpo;
}

const cor = (bk: BrandKit, chave: keyof PapeisDeCor): string => bk.cores[chave];

export function PreviewSlide({ slide, brandKit, formato, alturaExibicao, mostrarSafeArea }: Props) {
  const escala = alturaExibicao / formato.altura;
  const largura = formato.largura * escala;
  const altura = alturaExibicao;

  const fundo =
    "corPapel" in slide.fundo ? cor(brandKit, slide.fundo.corPapel) : "#333";

  const margem = brandKit.layout.margemSeguranca;

  return (
    <div className="artboard" style={{ width: largura, height: altura, background: fundo }}>
      {slide.camadas.map((c) => {
        if (!c.visivel) return null;
        const base: CSSProperties = {
          left: c.x * largura,
          top: c.y * altura,
          width: c.largura * largura,
          height: c.altura * altura,
          opacity: c.opacidade,
          transform: c.rotacao ? `rotate(${c.rotacao}deg)` : undefined,
          zIndex: c.z
        };

        if (c.tipo === "texto") {
          const est = { ...estiloPorPapel(brandKit, c.papel), ...(c.estilo ?? {}) };
          return (
            <div
              key={c.id}
              className="camada-texto"
              style={{
                ...base,
                color: cor(brandKit, c.corPapel),
                fontFamily: est.familia,
                fontWeight: est.peso,
                fontSize: est.tamanhoRel * altura,
                lineHeight: est.entrelinha,
                letterSpacing: est.tracking,
                textTransform: est.caixa === "maiuscula" ? "uppercase" : "none",
                textAlign: c.alinhamento,
                justifyContent:
                  c.alinhamento === "centro" ? "center" : c.alinhamento === "direita" ? "flex-end" : "flex-start",
                alignItems: "center"
              }}
            >
              <span>{c.texto}</span>
            </div>
          );
        }

        if (c.tipo === "forma") {
          const preench = (c.preenchimento in brandKit.cores)
            ? cor(brandKit, c.preenchimento as keyof PapeisDeCor)
            : String(c.preenchimento);
          return (
            <div key={c.id} style={{
              position: "absolute", ...base,
              background: preench,
              borderRadius: c.forma === "circulo" ? "50%" : 0
            }} />
          );
        }

        return null; // imagem/logo/grupo entram nas próximas ondas
      })}

      {mostrarSafeArea && (
        <div className="safe-area" style={{
          left: margem * largura, top: margem * altura,
          width: (1 - margem * 2) * largura, height: (1 - margem * 2) * altura
        }} />
      )}
    </div>
  );
}
