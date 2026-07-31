/**
 * Estado global (Zustand) + autosave em localStorage.
 * Na Onda 3 a persistência migra para Dexie/IndexedDB e depois para o back-end
 * (RF-12, RT-04); a interface do store foi desenhada para essa troca ser interna.
 */
import { create } from "zustand";
import {
  type Documento, type Post, type Slide, type FormatId, FORMATOS
} from "../model/schema";
import { documentoInicial } from "../model/factories";

const CHAVE = "4creaty-studio-doc";

function carregar(): Documento {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return JSON.parse(bruto) as Documento;
  } catch { /* ignora e usa o inicial */ }
  return documentoInicial();
}

interface EstadoStudio {
  doc: Documento;
  projetoId: string;
  postId: string;
  slideId: string;
  selecionarPost: (postId: string) => void;
  selecionarSlide: (slideId: string) => void;
  trocarFormato: (formato: FormatId) => void;
  postAtual: () => Post | undefined;
  slideAtual: () => Slide | undefined;
}

export const useProjeto = create<EstadoStudio>((set, get) => {
  const doc = carregar();
  const projeto = doc.projetos[0];
  const post = projeto?.posts[0];

  const salvar = (d: Documento) => {
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch { /* cota cheia */ }
  };

  return {
    doc,
    projetoId: projeto?.id ?? "",
    postId: post?.id ?? "",
    slideId: post?.slides[0]?.id ?? "",

    selecionarPost: (postId) => {
      const p = get().doc.projetos.flatMap((pr) => pr.posts).find((x) => x.id === postId);
      set({ postId, slideId: p?.slides[0]?.id ?? "" });
    },

    selecionarSlide: (slideId) => set({ slideId }),

    trocarFormato: (formato) => {
      if (formato === "custom") return;
      const d = structuredClone(get().doc);
      for (const pr of d.projetos) {
        const p = pr.posts.find((x) => x.id === get().postId);
        if (p) { p.formato = FORMATOS[formato]; p.atualizadoEm = new Date().toISOString(); }
      }
      salvar(d);
      set({ doc: d });
    },

    postAtual: () =>
      get().doc.projetos.flatMap((pr) => pr.posts).find((x) => x.id === get().postId),

    slideAtual: () => {
      const p = get().postAtual();
      return p?.slides.find((s) => s.id === get().slideId);
    }
  };
});
