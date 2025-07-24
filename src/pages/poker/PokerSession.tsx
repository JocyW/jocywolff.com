import { createSignal, onCleanup, onMount } from 'solid-js';
import { ParticipantList, Participant } from './ParticipantList';
import { CardSelector } from './CardSelector';
import { RevealControls } from './RevealControls';
import { DisplayNameInput } from './DisplayNameInput';

export interface PokerSessionProps {
  sessionId: string;
  isCreator: boolean;
  cardSet: string[];
  displayName: string;
  setDisplayName: (name: string) => void;
}

export const PokerSession = (props: PokerSessionProps) => {
  const [participants, setParticipants] = createSignal<Participant[]>([]);
  const [selectedCard, setSelectedCard] = createSignal<string | undefined>(undefined);
  const [revealed, setRevealed] = createSignal(false);
  const [selections, setSelections] = createSignal<Record<string, string>>({});
  const [room, setRoom] = createSignal<any>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [userId] = createSignal(() => {
    // Persist userId in sessionStorage for this session
    const key = `scrum-poker-userid-${props.sessionId}`;
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).substr(2, 8);
      sessionStorage.setItem(key, id);
    }
    return id;
  });

  // Fetch room state
  async function fetchRoom() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/room/${props.sessionId}`);
      if (!res.ok) throw new Error('Room not found');
      const data = await res.json();
      setRoom(data);
      setParticipants(data.participants || []);
      setSelections(data.selections || {});
      setRevealed(!!data.revealed);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Join room on mount
  onMount(async () => {
    await fetch(`/api/room/${props.sessionId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId(), displayName: props.displayName })
    });
    await fetchRoom();
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchRoom, 2000);
    onCleanup(() => clearInterval(interval));
  });

  // Update display name
  const handleNameChange = async (name: string) => {
    props.setDisplayName(name);
    await fetch(`/api/room/${props.sessionId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId(), displayName: name })
    });
    await fetchRoom();
  };

  // Card selection
  const handleCardSelect = async (card: string) => {
    setSelectedCard(card);
    await fetch(`/api/room/${props.sessionId}/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId(), card })
    });
    await fetchRoom();
  };

  // Reveal and new round
  const handleReveal = async () => {
    await fetch(`/api/room/${props.sessionId}/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId() })
    });
    await fetchRoom();
  };
  const handleNewRound = async () => {
    await fetch(`/api/room/${props.sessionId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId() })
    });
    setSelectedCard(undefined);
    await fetchRoom();
  };

  if (loading()) return <div>Loading session...</div>;
  if (error()) return <div class="text-red-600">Error: {error()}</div>;

  // Map selections to participants for display
  const participantList = participants().map((p: any) => ({
    ...p,
    selectedCard: selections()[p.userId],
    revealed: revealed(),
  }));

  return (
    <div class="flex flex-col gap-4 items-center justify-center h-full">
      <h2 class="text-2xl font-semibold">Session: {props.sessionId}</h2>
      <DisplayNameInput value={props.displayName} onChange={handleNameChange} />
      <ParticipantList participants={participantList} reveal={revealed()} />
      <CardSelector cardSet={props.cardSet} selected={selectedCard()} onSelect={handleCardSelect} disabled={revealed()} />
      <RevealControls revealed={revealed()} onReveal={handleReveal} onNewRound={handleNewRound} isCreator={props.isCreator} />
    </div>
  );
}; 