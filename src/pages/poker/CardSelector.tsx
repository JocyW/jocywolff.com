export const CardSelector = (props: { cardSet: string[]; selected: string | undefined; onSelect: (card: string) => void; disabled?: boolean }) => {
  return (
    <div class="flex flex-wrap gap-2 justify-center mt-4">
      {props.cardSet.map((card) => (
        <button
          class={`border px-4 py-2 rounded ${props.selected === card ? 'bg-green-700 text-white' : ''}`}
          onClick={() => props.onSelect(card)}
          disabled={props.disabled}
        >
          {card}
        </button>
      ))}
    </div>
  );
}; 