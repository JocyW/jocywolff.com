import { createSignal } from 'solid-js';

export const DisplayNameInput = (props: { value: string; onChange: (name: string) => void }) => {
  const [name, setName] = createSignal(props.value);
  return (
    <div class="flex flex-col gap-2 items-center">
      <input
        class="border p-2"
        placeholder="Enter your display name"
        value={name()}
        onInput={e => {
          setName(e.currentTarget.value);
          props.onChange(e.currentTarget.value);
        }}
      />
    </div>
  );
}; 