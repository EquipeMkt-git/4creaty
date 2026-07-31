/**
 * Fábricas e Brand Kit padrão 4blue. Centraliza a criação de entidades
 * para que todo o app produza dados coerentes com o schema (RT-01).
 */
import {
  SCHEMA_VERSION, FORMATOS, type BrandKit, type Projeto, type Post,
  type Slide, type PapeisDeCor, type Tipografia, type Documento
} from "./schema";

export const uid = (): string =>
  (crypto?.randomUUID?.() ?? "id-" + Math.random().toString(36).slice(2, 10));

const agora = (): string => new Date().toISOString();

/* Cores oficiais 4blue (docs/08). O 6º hex informado é inválido e ficou de fora. */
export const CORES_4BLUE: PapeisDeCor = {
  fundo: "#011527",
  fundoAlt: "#051F38",
  titulo: "#F1F3F9",
  corpo: "#F1F3F9",
  destaque: "#F8B90C",
  cta: "#F8B90C",
  textoSobreCta: "#011527",
  overlayImagem: "rgba(1,21,39,0.55)"
};

/* Tipografia: só Montserrat por ora (decisão do usuário; Knockout fica p/ depois). */
const TIPO_4BLUE: Tipografia = {
  titulo:    { familia: "Montserrat", peso: 800, caixa: "maiuscula", tamanhoRel: 0.085, entrelinha: 1.05, tracking: 0 },
  subtitulo: { familia: "Montserrat", peso: 600, caixa: "normal",    tamanhoRel: 0.045, entrelinha: 1.2,  tracking: 0 },
  corpo:     { familia: "Montserrat", peso: 400, caixa: "normal",    tamanhoRel: 0.038, entrelinha: 1.35, tracking: 0 }
};

export function brandKit4blue(): BrandKit {
  return {
    id: uid(),
    nome: "4blue",
    cores: { ...CORES_4BLUE },
    tipografia: TIPO_4BLUE,
    layout: { margemSeguranca: 0.08, espacamentoBase: 8, raioBorda: 16 },
    logo: {},
    estiloImagem: { tipo: "fotografia", pessoas: "indiferente" }
  };
}

export function criarProjeto(nome: string, cliente: string): Projeto {
  return {
    id: uid(), nome, cliente,
    brandKits: [brandKit4blue()], posts: [],
    criadoEm: agora(), atualizadoEm: agora()
  };
}

export function criarPost(projetoId: string, brandKitId: string): Post {
  return {
    id: uid(), projetoId, titulo: "Novo post", tipo: "carrossel",
    formato: FORMATOS["4:5"], brandKitId, status: "rascunho",
    slides: [], legenda: "", hashtags: [], versoes: [],
    criadoEm: agora(), atualizadoEm: agora()
  };
}

/** Post de exemplo para o shell renderizar já com conteúdo real. */
export function projetoDeExemplo(): Projeto {
  const projeto = criarProjeto("Demonstração", "4blue");
  const bk = projeto.brandKits[0];
  const post = criarPost(projeto.id, bk.id);
  post.titulo = "5 erros que drenam o caixa";

  const capa: Slide = {
    id: uid(), tipo: "capa", estado: "pronto",
    fundo: { corPapel: "fundo" },
    camadas: [
      {
        id: uid(), tipo: "texto", nome: "Título", papel: "titulo",
        x: 0.08, y: 0.30, largura: 0.84, altura: 0.28, ancora: "meio-esq",
        rotacao: 0, opacidade: 1, visivel: true, bloqueada: false, z: 2,
        texto: "5 erros que drenam o caixa", alinhamento: "esquerda", corPapel: "titulo"
      },
      {
        id: uid(), tipo: "texto", nome: "Selo", papel: "cta",
        x: 0.08, y: 0.62, largura: 0.5, altura: 0.08, ancora: "meio-esq",
        rotacao: 0, opacidade: 1, visivel: true, bloqueada: false, z: 2,
        texto: "Arraste para o lado", alinhamento: "esquerda", corPapel: "destaque"
      }
    ]
  };

  const conteudo: Slide = {
    id: uid(), tipo: "conteudo", estado: "pronto",
    fundo: { corPapel: "fundoAlt" },
    camadas: [
      {
        id: uid(), tipo: "texto", nome: "Título", papel: "titulo",
        x: 0.08, y: 0.14, largura: 0.84, altura: 0.14, ancora: "cima-esq",
        rotacao: 0, opacidade: 1, visivel: true, bloqueada: false, z: 2,
        texto: "O erro nº 1", alinhamento: "esquerda", corPapel: "destaque"
      },
      {
        id: uid(), tipo: "texto", nome: "Corpo", papel: "corpo",
        x: 0.08, y: 0.34, largura: 0.84, altura: 0.5, ancora: "cima-esq",
        rotacao: 0, opacidade: 1, visivel: true, bloqueada: false, z: 2,
        texto: "Escalar verba antes de validar a oferta. Sem oferta validada, mais tráfego só acelera o prejuízo.",
        alinhamento: "esquerda", corPapel: "corpo"
      }
    ]
  };

  post.slides = [capa, conteudo];
  projeto.posts = [post];
  return projeto;
}

export function documentoInicial(): Documento {
  return { schemaVersion: SCHEMA_VERSION, projetos: [projetoDeExemplo()] };
}
