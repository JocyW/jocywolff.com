import { BingoCard } from './BingoCard';

export type BingoCard = {
  id: string;
  name: string;
  isChecked: boolean;
};

export const BingoField = (props: { bingoCards: BingoCard[], onCardClick: (id: string) => void }) => {

  if(props.bingoCards.length === 0){
    return <div class="grow bg-dark-green text-white flex justify-center items-center w-full aspect-square p-6">
      <div class="flex flex-col gap-2">
        <h3 class="font-bold text-lg">
          How to play
        </h3>
        <div>
          Enter all possible bingo items into the text box below.
          The list must be separated by new lines. When clicking the update
          button 25 elements from that list
          will be picked randomly and placed on a 5x5 grid. Each element can
          be marked as completed individually and the state of the board will
          be stored locally.
        </div>
      </div>
    </div>
  }

  return (
      <div class="grid grid-cols-5 grow">
        {props.bingoCards.map((bingoCard) => (
          <BingoCard
            name={bingoCard.name}
            isChecked={bingoCard.isChecked}
            onCardClick={() => {
              props.onCardClick(bingoCard.id)
            }}
          />
        ))}
      </div>
  );
};
