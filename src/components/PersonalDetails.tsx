export const PersonalDetails = () => <div class="flex flex-col gap-2">
  <h2 class="text-gray-600 print:text-3xl text-4xl">
    Senior Software Engineer
  </h2>
  <div>
    <div>
      <a href="https://github.com/JocyW">https://github.com/JocyW</a>
    </div>
    <div>
      <a href="https://www.linkedin.com/in/jocy-wolff-b623a8233/"
      >https://www.linkedin.com/in/jocy-wolff-b623a8233/</a>
    </div>
  </div>
  {
    import.meta.env.VITE_SHOW_CONTACT_DETAILS === 'true' && (<div>
        <div>
          <a href={`tel:${import.meta.env.VITE_PHONE_NUMBER.replaceAll(' ', '')}`}>{import.meta.env.VITE_PHONE_NUMBER}</a>
        </div>
        <div>
          <a href={`mailto:${import.meta.env.VITE_EMAIL_ADDRESS}`}>{import.meta.env.VITE_EMAIL_ADDRESS}</a>
        </div>
      </div>
    )
  }
</div>;
