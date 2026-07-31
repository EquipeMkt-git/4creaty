/**
 * 4creaty Studio · Modelo de dados (RT-01)
 * Projeto -> Post -> Slide -> Camada. Versionado por SCHEMA_VERSION para
 * permitir migração futura sem quebrar posts antigos.
 *
 * Convenção de layout (RF-03): posição e tamanho das camadas são FRAÇÕES
 * (0..1) do artboard, com âncora — assim o reflow entre formatos é por regra
 * relativa, não por coordenada absoluta.
 */

export const SCHEMA_VERSION = 1;

/* ── Formatos (RF-03) ──────────────────────────────────────────── */

export type FormatId = "4:5" | "1:1" | "9:16" | "1.91:1" | "custom";

export interface Formato {
  id: FormatId;
  nome: string;
  largura: number;
  altura: number;
  uso: string;
}

export const FORMATOS: Record<Exclude<FormatId, "custom">, Formato> = {
  "4:5":    { id: "4:5",    nome: "Retrato",  largura: 1080, altura: 1350, uso: "Feed e carrossel (padrão)" },
  "1:1":    { id: "1:1",    nome: "Quadrado", largura: 1080, altura: 1080, uso: "Feed, LinkedIn, anúncios" },
  "9:16":   { id: "9:16",   nome: "Vertical", largura: 1080, altura: 1920, uso: "Stories, capa de Reels" },
  "1.91:1": { id: "1.91:1", nome: "Paisagem", largura: 1200, altura: 628,  uso: "Anúncios de link, Facebook" }
};

/* ── Brand Kit (RF-07) ─────────────────────────────────────────── */

/** Cores por papel — nunca uma lista solta. */
export interface PapeisDeCor {
  fundo: string;
  fundoAlt: string;
  titulo: string;
  corpo: string;
  destaque: string;
  cta: string;
  textoSobreCta: string;
  overlayImagem: string; // rgba ou hex+alpha
}

export interface EstiloTipografico {
  familia: string;
  peso: number;
  caixa: "normal" | "maiuscula";
  /** Tamanho como fração da altura do artboard (RF-07: escala relativa). */
  tamanhoRel: number;
  entrelinha: number;
  tracking: number;
}

export interface Tipografia {
  titulo: EstiloTipografico;
  subtitulo: EstiloTipografico;
  corpo: EstiloTipografico;
}

export interface RegrasDeLayout {
  margemSeguranca: number; // fração do artboard
  espacamentoBase: number; // px em 1x
  raioBorda: number;       // px em 1x
}

export interface LogoVariantes {
  principal?: string;
  monoClaro?: string;
  monoEscuro?: string;
  simbolo?: string;
}

export interface EstiloDeImagem {
  tipo: "fotografia" | "3d" | "ilustracao" | "abstrato";
  iluminacao?: string;
  temperatura?: string;
  saturacao?: string;
  pessoas?: "com" | "sem" | "indiferente";
  evitar?: string;
  referencias?: string[]; // urls de moodboard
}

export interface TomDeVoz {
  tom?: string;
  pessoa?: string;
  formalidade?: string;
  jargoesProibidos?: string[];
  exemplosSim?: string[];
  exemplosNao?: string[];
}

export interface BrandKit {
  id: string;
  nome: string;
  cores: PapeisDeCor;
  /** Paletas alternativas (ex.: clara, escura) alternáveis por slide. */
  paletas?: { id: string; nome: string; cores: PapeisDeCor }[];
  tipografia: Tipografia;
  layout: RegrasDeLayout;
  logo: LogoVariantes;
  estiloImagem?: EstiloDeImagem;
  tomDeVoz?: TomDeVoz;
}

/* ── Camadas (RF-04) ───────────────────────────────────────────── */

export type PapelDeCamada = "titulo" | "subtitulo" | "corpo" | "destaque" | "cta" | "fundo" | "neutro";
export type Ancora =
  | "cima-esq" | "cima-centro" | "cima-dir"
  | "meio-esq" | "centro"      | "meio-dir"
  | "baixo-esq" | "baixo-centro" | "baixo-dir";

interface CamadaBase {
  id: string;
  nome: string;
  /** Retângulo em frações (0..1) do artboard. */
  x: number; y: number; largura: number; altura: number;
  ancora: Ancora;
  rotacao: number;
  opacidade: number;
  visivel: boolean;
  bloqueada: boolean;
  z: number;
}

export interface CamadaTexto extends CamadaBase {
  tipo: "texto";
  papel: PapelDeCamada;
  texto: string;
  /** Sobrescreve a tipografia do Brand Kit quando presente. */
  estilo?: Partial<EstiloTipografico>;
  alinhamento: "esquerda" | "centro" | "direita";
  corPapel: keyof PapeisDeCor; // resolve o hex pelo Brand Kit
}

export interface Filtros { brilho: number; contraste: number; saturacao: number; blur: number; }

export interface CamadaImagem extends CamadaBase {
  tipo: "imagem";
  assetId?: string;      // referência à biblioteca do projeto (RF-05)
  src: string;
  focal: { x: number; y: number }; // ponto focal p/ recrop no reflow (RF-03)
  mascara?: "nenhuma" | "circulo" | "retangulo";
  filtros: Filtros;
  licenca?: { fonte: string; tipo: string; idOrigem: string }; // rastreabilidade (RF-05)
}

export interface CamadaForma extends CamadaBase {
  tipo: "forma";
  forma: "retangulo" | "circulo" | "linha";
  preenchimento: keyof PapeisDeCor | string;
  borda?: { cor: string; espessura: number };
}

export interface CamadaLogo extends CamadaBase {
  tipo: "logo";
  variante: keyof LogoVariantes;
}

export interface CamadaGrupo extends CamadaBase {
  tipo: "grupo";
  filhos: Camada[];
}

export type Camada = CamadaTexto | CamadaImagem | CamadaForma | CamadaLogo | CamadaGrupo;

/* ── Slide, Post, Projeto ──────────────────────────────────────── */

export type TipoSlide = "capa" | "conteudo" | "cta";

export interface Slide {
  id: string;
  tipo: TipoSlide; // semântico: a IA escolhe layout; capa fica na 1, CTA no fim (RF-02)
  fundo: { corPapel: keyof PapeisDeCor } | { imagemAssetId: string };
  camadas: Camada[];
  estado: "pronto" | "gerando" | "erro"; // indicador por slide (RF-01)
}

export type TipoPost = "carrossel" | "feed" | "anuncio" | "story";
export type StatusPost = "rascunho" | "revisao" | "aprovado" | "publicado";

export interface VersaoSnapshot {
  id: string;
  criadoEm: string;
  rotulo: string;
  slides: Slide[]; // snapshot para restaurar (RF-12)
}

export interface Post {
  id: string;
  projetoId: string;
  titulo: string;
  tipo: TipoPost;
  formato: Formato;
  brandKitId: string;
  status: StatusPost;
  slides: Slide[];
  legenda: string;
  hashtags: string[];
  versoes: VersaoSnapshot[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface Projeto {
  id: string;
  nome: string;
  cliente: string; // isolamento multi-cliente (RT-04)
  brandKits: BrandKit[];
  posts: Post[];
  criadoEm: string;
  atualizadoEm: string;
}

/** Raiz persistida — carrega o schemaVersion para migração (RT-01). */
export interface Documento {
  schemaVersion: number;
  projetos: Projeto[];
}
