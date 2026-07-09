import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import type { Card, ColumnId, LabelMap, Member, TeamId } from "./types";

const CARD_SELECT = `
  id, title, description, col, team_id, due, ms, run, start_at, position, cover_attachment_id,
  card_members(member_id),
  card_labels(label_name),
  checklist_items(id, text, done, position),
  comments(id, text, created_at, author_id, profiles(name, ini)),
  card_attachments!card_attachments_card_id_fkey(id, url, name)
`;

interface ProfileRow {
  id: string;
  name: string;
  ini: string;
  team_id: TeamId;
  avatar_url: string | null;
  bg_color: string | null;
}

interface LabelRow {
  name: string;
  color: string;
}

interface CardRow {
  id: string;
  title: string;
  description: string;
  col: ColumnId;
  team_id: TeamId;
  due: string | null;
  ms: number;
  run: boolean;
  start_at: string | null;
  position: number;
  cover_attachment_id: string | null;
  card_members: { member_id: string }[] | null;
  card_labels: { label_name: string }[] | null;
  checklist_items: { id: string; text: string; done: boolean; position: number }[] | null;
  comments:
    | { id: string; text: string; created_at: string; author_id: string | null; profiles: { name: string; ini: string } | null }[]
    | null;
  card_attachments: { id: string; url: string; name: string }[] | null;
}

function mapCard(row: CardRow): Card {
  return {
    id: row.id,
    title: row.title,
    desc: row.description,
    col: row.col,
    team: row.team_id,
    members: (row.card_members ?? []).map((m) => m.member_id),
    labels: (row.card_labels ?? []).map((l) => l.label_name),
    due: row.due,
    check: (row.checklist_items ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ id: c.id, text: c.text, done: c.done })),
    comments: (row.comments ?? [])
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((c) => ({
        id: c.id,
        authorId: c.author_id,
        authorName: c.profiles?.name ?? "Ex-membro",
        text: c.text,
        createdAt: c.created_at,
      })),
    attachments: (row.card_attachments ?? []).map((a) => ({ id: a.id, url: a.url, name: a.name })),
    coverAttachmentId: row.cover_attachment_id,
    ms: Number(row.ms),
    run: row.run,
    start: row.start_at ? new Date(row.start_at).getTime() : null,
    position: row.position,
  };
}

export function useSupabaseBoard(userId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [labels, setLabels] = useState<LabelMap>({});
  const [cards, setCards] = useState<Card[]>([]);
  const [myBgColor, setMyBgColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cardsRef = useRef<Card[]>([]);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const fetchAll = useCallback(async () => {
    const [profilesRes, labelsRes, cardsRes] = await Promise.all([
      supabase.from("profiles").select("id, name, ini, team_id, avatar_url, bg_color").order("name"),
      supabase.from("labels").select("name, color").order("name"),
      supabase.from("cards").select(CARD_SELECT).order("position"),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (labelsRes.error) throw labelsRes.error;
    if (cardsRes.error) throw cardsRes.error;

    const profileRows = profilesRes.data as ProfileRow[];
    setMembers(
      profileRows.map((p) => ({ id: p.id, ini: p.ini, name: p.name, team: p.team_id, avatarUrl: p.avatar_url })),
    );
    setMyBgColor(profileRows.find((p) => p.id === userId)?.bg_color ?? null);
    setLabels(Object.fromEntries((labelsRes.data as LabelRow[]).map((l) => [l.name, l.color])));
    setCards((cardsRes.data as unknown as CardRow[]).map(mapCard));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefetch = () => {
      clearTimeout(timer);
      timer = setTimeout(fetchAll, 250);
    };

    const channel = supabase
      .channel("board-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "cards" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "card_members" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "card_labels" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "checklist_items" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "labels" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "card_attachments" }, scheduleRefetch)
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  async function addCard(col: ColumnId, teamId: TeamId): Promise<string> {
    const siblings = cardsRef.current.filter((c) => c.col === col);
    const position = siblings.length ? Math.max(...siblings.map((c) => c.position)) + 1 : 0;
    const { data, error } = await supabase
      .from("cards")
      .insert({ col, team_id: teamId, position })
      .select("id")
      .single();
    if (error) throw error;
    await fetchAll();
    return data.id as string;
  }

  async function updateCard(id: string, patch: Partial<Card>) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.desc !== undefined) dbPatch.description = patch.desc;
    if (patch.col !== undefined) dbPatch.col = patch.col;
    if (patch.team !== undefined) dbPatch.team_id = patch.team;
    if (patch.due !== undefined) dbPatch.due = patch.due;
    if (patch.ms !== undefined) dbPatch.ms = patch.ms;
    if (patch.run !== undefined) dbPatch.run = patch.run;
    if (patch.start !== undefined) dbPatch.start_at = patch.start ? new Date(patch.start).toISOString() : null;
    const { error } = await supabase.from("cards").update(dbPatch).eq("id", id);
    if (error) throw error;
    await fetchAll();
  }

  async function deleteCard(id: string) {
    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) throw error;
    await fetchAll();
  }

  async function moveCard(id: string, toCol: ColumnId, beforeId?: string | null) {
    const moving = cardsRef.current.find((c) => c.id === id);
    if (!moving) return;
    const destCards = cardsRef.current
      .filter((c) => c.col === toCol && c.id !== id)
      .sort((a, b) => a.position - b.position);
    const insertIndex = beforeId ? destCards.findIndex((c) => c.id === beforeId) : -1;
    const index = insertIndex === -1 ? destCards.length : insertIndex;
    const newOrder = [...destCards.slice(0, index), moving, ...destCards.slice(index)];

    const previousCards = cardsRef.current;
    const positionById = new Map(newOrder.map((c, i) => [c.id, i]));
    const optimisticCards = previousCards.map((c) =>
      positionById.has(c.id) ? { ...c, col: toCol, position: positionById.get(c.id)! } : c,
    );
    setCards(optimisticCards);

    const results = await Promise.all(
      newOrder.map((c, i) => supabase.from("cards").update({ col: toCol, position: i }).eq("id", c.id)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      setCards(previousCards);
      throw failed.error;
    }
  }

  async function toggleCardLabel(cardId: string, label: string) {
    const card = cardsRef.current.find((c) => c.id === cardId);
    if (!card) return;
    const { error } = card.labels.includes(label)
      ? await supabase.from("card_labels").delete().eq("card_id", cardId).eq("label_name", label)
      : await supabase.from("card_labels").insert({ card_id: cardId, label_name: label });
    if (error) throw error;
    await fetchAll();
  }

  async function toggleCardMember(cardId: string, memberId: string) {
    const card = cardsRef.current.find((c) => c.id === cardId);
    if (!card) return;
    const { error } = card.members.includes(memberId)
      ? await supabase.from("card_members").delete().eq("card_id", cardId).eq("member_id", memberId)
      : await supabase.from("card_members").insert({ card_id: cardId, member_id: memberId });
    if (error) throw error;
    await fetchAll();
  }

  async function toggleTimer(cardId: string, stopOthers: boolean) {
    const now = Date.now();
    const card = cardsRef.current.find((c) => c.id === cardId);
    if (!card) return;

    if (card.run) {
      const elapsed = card.start ? now - card.start : 0;
      const { error } = await supabase
        .from("cards")
        .update({ run: false, ms: card.ms + elapsed, start_at: null })
        .eq("id", cardId);
      if (error) throw error;
    } else {
      if (stopOthers) {
        const others = cardsRef.current.filter((c) => c.run && c.id !== cardId);
        await Promise.all(
          others.map((o) => {
            const elapsed = o.start ? now - o.start : 0;
            return supabase.from("cards").update({ run: false, ms: o.ms + elapsed, start_at: null }).eq("id", o.id);
          }),
        );
      }
      const { error } = await supabase
        .from("cards")
        .update({ run: true, start_at: new Date(now).toISOString() })
        .eq("id", cardId);
      if (error) throw error;
    }
    await fetchAll();
  }

  async function addChecklistItem(cardId: string, text: string) {
    if (!text.trim()) return;
    const card = cardsRef.current.find((c) => c.id === cardId);
    const position = card && card.check.length ? card.check.length : 0;
    const { error } = await supabase
      .from("checklist_items")
      .insert({ card_id: cardId, text: text.trim(), position });
    if (error) throw error;
    await fetchAll();
  }

  async function toggleChecklistItem(cardId: string, itemId: string) {
    const card = cardsRef.current.find((c) => c.id === cardId);
    const item = card?.check.find((i) => i.id === itemId);
    if (!item) return;
    const { error } = await supabase.from("checklist_items").update({ done: !item.done }).eq("id", itemId);
    if (error) throw error;
    await fetchAll();
  }

  async function removeChecklistItem(itemId: string) {
    const { error } = await supabase.from("checklist_items").delete().eq("id", itemId);
    if (error) throw error;
    await fetchAll();
  }

  async function addComment(cardId: string, text: string) {
    if (!text.trim()) return;
    const { error } = await supabase
      .from("comments")
      .insert({ card_id: cardId, text: text.trim(), author_id: userId });
    if (error) throw error;
    await fetchAll();
  }

  async function removeMember(id: string) {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw error;
    await fetchAll();
  }

  async function addLabel(name: string, color: string) {
    const key = name.trim().toUpperCase();
    if (!key) return;
    const { error } = await supabase.from("labels").upsert({ name: key, color });
    if (error) throw error;
    await fetchAll();
  }

  async function removeLabel(name: string) {
    const { error } = await supabase.from("labels").delete().eq("name", name);
    if (error) throw error;
    await fetchAll();
  }

  async function uploadAvatar(file: File) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
    const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
    if (error) throw error;
    await fetchAll();
  }

  async function setBgColor(color: string | null) {
    const { error } = await supabase.from("profiles").update({ bg_color: color }).eq("id", userId);
    if (error) throw error;
    await fetchAll();
  }

  async function uploadAttachment(cardId: string, file: File) {
    const path = `${cardId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("attachments").getPublicUrl(path);
    const { error } = await supabase
      .from("card_attachments")
      .insert({ card_id: cardId, path, url: data.publicUrl, name: file.name });
    if (error) throw error;
    await fetchAll();
  }

  async function removeAttachment(attachmentId: string) {
    const card = cardsRef.current.find((c) => c.attachments.some((a) => a.id === attachmentId));
    if (card?.coverAttachmentId === attachmentId) {
      await supabase.from("cards").update({ cover_attachment_id: null }).eq("id", card.id);
    }
    const { error } = await supabase.from("card_attachments").delete().eq("id", attachmentId);
    if (error) throw error;
    await fetchAll();
  }

  async function setCover(cardId: string, attachmentId: string | null) {
    const { error } = await supabase.from("cards").update({ cover_attachment_id: attachmentId }).eq("id", cardId);
    if (error) throw error;
    await fetchAll();
  }

  return {
    members,
    labels,
    cards,
    myBgColor,
    loading,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    toggleCardLabel,
    toggleCardMember,
    toggleTimer,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    addComment,
    removeMember,
    addLabel,
    removeLabel,
    uploadAvatar,
    setBgColor,
    uploadAttachment,
    removeAttachment,
    setCover,
  };
}
