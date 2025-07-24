import { createSignal } from 'solid-js';

const DEFAULT_SETS = [
  ['1', '2', '3', '5', '8', '13', '21'], // Fibonacci
  ['XS', 'S', 'M', 'L', 'XL'], // T-shirt sizes
  ['0', '1/2', '1', '2', '3', '5', '8', '13', '?', '☕'] // Scrum
];

export const CardSetSelector = (props: { onSelect: (cards: string[]) => void }) => {
  const [customSet, setCustomSet] = createSignal('');

  return (
    <div class="flex flex-col gap-2 items-center">
      <div class="flex flex-col gap-2">
        <div class="font-semibold">Choose a card set:</div>
        {DEFAULT_SETS.map((set, i) => (
          <button class="border px-3 py-1 rounded" onClick={() => props.onSelect(set)}>
            {set.join(', ')}
          </button>
        ))}
      </div>
      <div class="mt-4 w-full flex flex-col items-center">
        <div class="font-semibold">Or define a custom set (comma separated):</div>
        <input
          class="border p-2 w-64"
          placeholder="e.g. 1,2,3,5,8,13,21"
          value={customSet()}
          onInput={e => setCustomSet(e.currentTarget.value)}
        />
        <button
          class="bg-green-700 text-white px-4 py-2 rounded mt-2"
          onClick={() => props.onSelect(customSet().split(',').map(s => s.trim()).filter(Boolean))}
          disabled={!customSet().trim()}
        >
          Use Custom Set
        </button>
      </div>
    </div>
  );
}; 