import { createSignal, Switch, Match } from 'solid-js';
import { PokerSession } from './PokerSession';
import { CardSetSelector } from './CardSetSelector';
import { DisplayNameInput } from './DisplayNameInput';

export const Poker = () => {
  const [sessionId, setSessionId] = createSignal<string | null>(null);
  const [isCreator, setIsCreator] = createSignal(false);
  const [cardSet, setCardSet] = createSignal<string[]>([]);
  const [displayName, setDisplayName] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Step 1: Choose to create or join
  const [step, setStep] = createSignal<'choose' | 'create' | 'join' | 'session'>('choose');

  // Handlers
  const handleCreate = () => {
    setIsCreator(true);
    setStep('create');
  };
  const handleJoin = () => {
    setIsCreator(false);
    setStep('join');
  };
  const handleCardSetSelected = async (cards: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardSet: cards, initiator: displayName() || 'Initiator' })
      });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      setCardSet(cards);
      setSessionId(data.roomId);
      setStep('session');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const handleJoinSession = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/room/${id}`);
      if (!res.ok) throw new Error('Session not found');
      const data = await res.json();
      setCardSet(data.cardSet || []);
      setSessionId(id);
      setStep('session');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Switch>
      <Match when={step() === 'choose'}>
        <div class="flex flex-col gap-4 items-center justify-center h-full">
          <h1 class="text-3xl font-bold">SCRUM Poker</h1>
          <DisplayNameInput value={displayName()} onChange={setDisplayName} />
          <button class="bg-green-700 text-white px-4 py-2 rounded" onClick={handleCreate}>Create Session</button>
          <button class="bg-blue-700 text-white px-4 py-2 rounded" onClick={handleJoin}>Join Session</button>
        </div>
      </Match>
      <Match when={step() === 'create'}>
        <div class="flex flex-col gap-4 items-center justify-center h-full">
          <h2 class="text-2xl font-semibold">Create a Session</h2>
          {loading() && <div>Creating session...</div>}
          {error() && <div class="text-red-600">{error()}</div>}
          <CardSetSelector onSelect={handleCardSetSelected} />
        </div>
      </Match>
      <Match when={step() === 'join'}>
        {(() => {
          let input: HTMLInputElement | undefined;
          return (
            <div class="flex flex-col gap-4 items-center justify-center h-full">
              <h2 class="text-2xl font-semibold">Join a Session</h2>
              <DisplayNameInput value={displayName()} onChange={setDisplayName} />
              <input ref={input} class="border p-2" placeholder="Enter Session ID" />
              <button class="bg-blue-700 text-white px-4 py-2 rounded" onClick={() => input && handleJoinSession(input.value)}>Join</button>
              {loading() && <div>Joining session...</div>}
              {error() && <div class="text-red-600">{error()}</div>}
            </div>
          );
        })()}
      </Match>
      <Match when={step() === 'session'}>
        <PokerSession
          sessionId={sessionId()!}
          isCreator={isCreator()}
          cardSet={cardSet()}
          displayName={displayName()}
          setDisplayName={setDisplayName}
        />
      </Match>
    </Switch>
  );
}; 