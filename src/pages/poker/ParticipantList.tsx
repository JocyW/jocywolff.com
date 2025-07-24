export type Participant = {
  id: string;
  name: string;
  selectedCard?: string;
  revealed: boolean;
};

export const ParticipantList = (props: { participants: Participant[]; reveal: boolean }) => {
  return (
    <div class="flex flex-col gap-2 items-center">
      <h3 class="font-semibold">Participants</h3>
      <ul>
        {props.participants.map((p) => (
          <li>
            <span class="font-bold">{p.name}</span>
            {props.reveal && p.selectedCard ? (
              <span>: {p.selectedCard}</span>
            ) : (
              <span>: {p.selectedCard ? 'Selected' : 'Not selected'}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}; 