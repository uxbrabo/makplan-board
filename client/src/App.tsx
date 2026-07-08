import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Board } from "./components/Board";
import { Dashboard } from "./components/Dashboard";
import { CardModal } from "./components/CardModal";
import { ManageModal } from "./components/ManageModal";
import { AuthScreen } from "./auth/AuthScreen";
import { useAuth } from "./auth/useAuth";
import { useSupabaseBoard } from "./useSupabaseBoard";
import { useTweaks } from "./useTweaks";
import { TEAMS } from "./constants";
import type { BoardState, ColumnId } from "./types";
import "./App.css";

function App() {
  const { session, loading: authLoading, signIn, signUp, signOut } = useAuth();

  if (authLoading) {
    return <div className="status-message">Carregando...</div>;
  }

  if (!session) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  return <BoardApp userId={session.user.id} userEmail={session.user.email ?? ""} onSignOut={signOut} />;
}

function BoardApp({ userId, userEmail, onSignOut }: { userId: string; userEmail: string; onSignOut: () => void }) {
  const boardData = useSupabaseBoard(userId);
  const { tweaks } = useTweaks();
  const [view, setView] = useState<"board" | "overview">("board");
  const [filter, setFilter] = useState<BoardState["filter"]>("todas");
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  const anyRunning = boardData.cards.some((c) => c.run);

  useEffect(() => {
    if (!anyRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [anyRunning]);

  if (boardData.loading) {
    return <div className="status-message">Carregando quadro...</div>;
  }

  const state: BoardState = {
    cards: boardData.cards,
    members: boardData.members,
    labels: boardData.labels,
    filter,
    tweaks,
  };

  const openCard = state.cards.find((c) => c.id === openCardId) ?? null;

  async function handleAddCard(col: ColumnId) {
    const teamId = filter !== "todas" ? filter : TEAMS[0].id;
    const id = await boardData.addCard(col, teamId);
    setOpenCardId(id);
  }

  return (
    <div className="app">
      <Header
        view={view}
        onChangeView={setView}
        filter={filter}
        onChangeFilter={setFilter}
        onManage={() => setManageOpen(true)}
        userEmail={userEmail}
        onSignOut={onSignOut}
      />

      {view === "board" ? (
        <Board
          state={state}
          now={now}
          onOpenCard={setOpenCardId}
          onToggleTimer={(id) => boardData.toggleTimer(id, tweaks.timerUnico).catch(console.error)}
          onAddCard={(col) => handleAddCard(col).catch(console.error)}
          onMoveCard={(id, toCol, beforeId) => boardData.moveCard(id, toCol, beforeId).catch(console.error)}
        />
      ) : (
        <Dashboard state={state} now={now} onOpenCard={setOpenCardId} />
      )}

      {openCard && (
        <CardModal
          card={openCard}
          state={state}
          now={now}
          onClose={() => setOpenCardId(null)}
          onUpdate={(patch) => boardData.updateCard(openCard.id, patch).catch(console.error)}
          onDelete={() => {
            boardData.deleteCard(openCard.id).catch(console.error);
            setOpenCardId(null);
          }}
          onToggleTimer={() => boardData.toggleTimer(openCard.id, tweaks.timerUnico).catch(console.error)}
          onToggleLabel={(label) => boardData.toggleCardLabel(openCard.id, label).catch(console.error)}
          onToggleMember={(memberId) => boardData.toggleCardMember(openCard.id, memberId).catch(console.error)}
          onAddChecklist={(text) => boardData.addChecklistItem(openCard.id, text).catch(console.error)}
          onToggleChecklist={(itemId) => boardData.toggleChecklistItem(openCard.id, itemId).catch(console.error)}
          onRemoveChecklist={(itemId) => boardData.removeChecklistItem(itemId).catch(console.error)}
          onAddComment={(text) => boardData.addComment(openCard.id, text).catch(console.error)}
        />
      )}

      {manageOpen && (
        <ManageModal
          state={state}
          onClose={() => setManageOpen(false)}
          onRemoveMember={(id) => boardData.removeMember(id).catch(console.error)}
          onAddLabel={(name, color) => boardData.addLabel(name, color).catch(console.error)}
          onRemoveLabel={(name) => boardData.removeLabel(name).catch(console.error)}
        />
      )}
    </div>
  );
}

export default App;
