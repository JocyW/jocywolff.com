export type BingoCardProps = {
  onCardClick: () => void;
  name: string;
  isChecked: boolean;
};

export const BingoCard = ({ onCardClick, name, isChecked }: BingoCardProps) => {
  return (
    <button
      class={
        `bg-dark-green p-3 text-white aspect-square flex justify-center items-center text-center relative 
        ${isChecked && 'after:block after:w-full after:h-2 after:bg-[#F98C7D] after:absolute after:rotate-45 after:rounded-full ' +
        'before:block before:w-full before:content before:h-2 before:bg-[#F98C7D] before:absolute before:-rotate-45 before:rounded-full '}
        `
      }
      aria-checked={isChecked}
      onClick={onCardClick}
    >
      <div>{name}</div>
    </button>
  );
};
