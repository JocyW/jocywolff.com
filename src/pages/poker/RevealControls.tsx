import { Show } from 'solid-js';

export const RevealControls = (props: { revealed: boolean; onReveal: () => void; onNewRound: () => void; isCreator: boolean }) => {
  return (
    <Show when={props.isCreator}>
      <div class="flex gap-4 mt-4">
        <Show when={!props.revealed} fallback={
          <button class="bg-green-700 text-white px-4 py-2 rounded" onClick={props.onNewRound}>
            Start New Round
          </button>
        }>
          <button class="bg-yellow-600 text-white px-4 py-2 rounded" onClick={props.onReveal}>
            Reveal Cards
          </button>
        </Show>
      </div>
    </Show>
  );
}; 