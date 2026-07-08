import type { ColumnId, Team, Tweaks } from "./types";

export const TEAMS: Team[] = [
  { id: "criacao", name: "Criação", color: "#9d84f7" },
  { id: "redacao", name: "Redação", color: "#6ea8e8" },
  { id: "atendimento", name: "Atendimento", color: "#35c48d" },
  { id: "diretoria", name: "Diretoria", color: "#e8a04c" },
];

export const COLUMNS: { id: ColumnId; title: string }[] = [
  { id: "pauta", title: "Pauta" },
  { id: "afazer", title: "A fazer" },
  { id: "fazendo", title: "Fazendo" },
  { id: "ajustes", title: "Ajustes" },
  { id: "entregue", title: "Entregue" },
];

export const LABEL_PALETTE = [
  "#C9372C",
  "#B4560F",
  "#E07A1F",
  "#946F00",
  "#1F845A",
  "#1D6FD6",
  "#8F3FBF",
  "#6b707a",
];

export const AGENCY_EMAIL_DOMAIN = "makplan.com.br";

export const WORKSPACE_BG_PALETTE: { name: string; value: string | null }[] = [
  { name: "Padrão", value: null },
  { name: "Vermelho Makplan", value: "#1f1315" },
  { name: "Grafite", value: "#1c1c1e" },
  { name: "Azul-noite", value: "#12161f" },
  { name: "Verde-musgo", value: "#131b16" },
  { name: "Roxo-escuro", value: "#191420" },
];

export const TWEAKS_STORAGE_KEY = "makplan-tweaks";

export const defaultTweaks: Tweaks = {
  corDestaque: "#d73347",
  timerUnico: false,
  mostrarSegundos: false,
};
