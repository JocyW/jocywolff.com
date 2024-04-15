import { createUniqueId } from 'solid-js';

export const PersonalDetails = () => {
  const headingId = createUniqueId()

  return <div class="flex flex-col gap-2">
    <h2 id={headingId} class="text-gray-600 print:text-3xl text-4xl">
      Senior Software Engineer
    </h2>
    <div aria-labelledby={headingId}>
      <div aria-label="Github link">
        <a href="https://github.com/JocyW">https://github.com/JocyW</a>
      </div>
      <div aria-label="Linkedin link">
        <a href="https://www.linkedin.com/in/jocy-wolff-b623a8233/"
        >https://www.linkedin.com/in/jocy-wolff-b623a8233/</a>
      </div>
    </div>
    {
      import.meta.env.VITE_SHOW_CONTACT_DETAILS === 'true' && (<div>
          <div aria-label="Phone number">
            <a
              href={`tel:${import.meta.env.VITE_PHONE_NUMBER.replaceAll(' ', '')}`}>{import.meta.env.VITE_PHONE_NUMBER}</a>
          </div>
          <div aria-label="E-Mail address">
            <a href={`mailto:${import.meta.env.VITE_EMAIL_ADDRESS}`}>{import.meta.env.VITE_EMAIL_ADDRESS}</a>
          </div>
        </div>
      )
    }
  </div>;
};
