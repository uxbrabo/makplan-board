export type TeamId = "criacao" | "redacao" | "atendimento" | "diretoria";

export interface Team {
  id: TeamId;
  name: string;
  color: string;
}

export interface Member {
  id: string;
  ini: string;
  name: string;
  team: TeamId;
}

export type LabelMap = Record<string, string>;

export type ColumnId = "pauta" | "afazer" | "fazendo" | "ajustes" | "entregue";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Comment {
  id: string;
  authorId: string | null;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Card {
  id: string;
  title: string;
  desc: string;
  col: ColumnId;
  team: TeamId;
  members: string[];
  labels: string[];
  due: string | null;
  check: ChecklistItem[];
  comments: Comment[];
  ms: number;
  run: boolean;
  start: number | null;
  position: number;
}

export interface Tweaks {
  corDestaque: string;
  timerUnico: boolean;
  mostrarSegundos: boolean;
}

export interface BoardState {
  cards: Card[];
  members: Member[];
  labels: LabelMap;
  filter: TeamId | "todas";
  tweaks: Tweaks;
}
