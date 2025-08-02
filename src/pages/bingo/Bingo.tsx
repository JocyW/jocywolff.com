import { createEffect, createSignal, createUniqueId } from 'solid-js';
import { BingoCard, BingoField } from './components/BingoField';
// import shuffle from 'lodash.shuffle';
import { SubHeading } from '../../components/SubHeading';

const LS_KEY = 'bingo';
const FIELD_SIZE = 5;
const FIELD_ITEMS_COUNT = FIELD_SIZE * FIELD_SIZE;

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const toBingoCards = (text?: string): BingoCard[] => {
  let items = text.split('\n');
  const fillUpArray = items.length < FIELD_ITEMS_COUNT
    ? Array(FIELD_ITEMS_COUNT - items.length).fill({
      id: createUniqueId(),
      name: 'Joker',
      isChecked: true
    } satisfies BingoCard)
    : [];

  return shuffleArray(
    [...items.map((name) => {
      return {
        id: createUniqueId(),
        name,
        isChecked: false
      } satisfies BingoCard;
    }), ...fillUpArray]).slice(0, 25);
};

export const Bingo = () => {
  let text!: HTMLTextAreaElement;
  const [names, setNames] = createSignal<BingoCard[]>(JSON.parse(localStorage.getItem(LS_KEY)) ?? []);
  const onButtonClick = () => {
    setNames(
      toBingoCards(text.value)
    );
  };

  createEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(names()));
  });

  const handleCardClick = (id: string) => {
    setNames((oldcards) =>
      oldcards.map((card) => ({
        name: card.name,
        id: card.id,
        isChecked: id === card.id ? !card.isChecked : card.isChecked
      }))
    );
  };

  return (
    <div class="flex justify-around">
      <div class="max-w-[600px] w-full flex flex-col gap-4">
        <SubHeading>Bingo</SubHeading>
        <BingoField bingoCards={names()} onCardClick={handleCardClick} />
        <textarea ref={text} placeholder="Bingo item 1
Bingo item 2
Bingo item 3
...
Bingo item 30" class="border p-3"></textarea>
        <button onClick={onButtonClick} class="bg-[#89A497] px-4 py-2 hover:bg-[#324f41] focus:bg-[#324f41]">
          Update tiles
        </button>
      </div>
    </div>
  );
};