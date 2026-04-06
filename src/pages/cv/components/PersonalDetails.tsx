import { useId } from 'react';
import { FaGithub, FaLinkedin, FaPhone, FaEnvelope } from 'react-icons/fa';
import { SubHeading } from '../../../components/SubHeading';

export const PersonalDetails = () => {
  const headingId = useId();

  return <div className="flex flex-col gap-2">
    <SubHeading id={headingId}>
      Senior Software Engineer
    </SubHeading>
    <div aria-labelledby={headingId}>
      <div aria-label="Github link" className="flex gap-1 items-center">
        <FaGithub aria-label="GitHub icon" />
        <a href="https://github.com/JocyW">https://github.com/JocyW</a>
      </div>
      <div aria-label="Linkedin link" className="flex gap-1 items-center">
        <FaLinkedin aria-label="LinkedIn icon" />
        <a href="https://www.linkedin.com/in/jocy-wolff-b623a8233/"
        >https://www.linkedin.com/in/jocy-wolff-b623a8233/</a>
      </div>
    </div>
    {
      import.meta.env.VITE_SHOW_CONTACT_DETAILS === 'true' && (<div>
          <div aria-label="Phone number" className="flex gap-1 items-center">
            <FaPhone aria-label="Phone icon" />
            <a
              href={`tel:${import.meta.env.VITE_PHONE_NUMBER.replaceAll(' ', '')}`}>{import.meta.env.VITE_PHONE_NUMBER}</a>
          </div>
          <div aria-label="E-Mail address" className="flex gap-1 items-center">
            <FaEnvelope className="translate-y-[0.05em]" aria-label="Envelope icon" />
            <a href={`mailto:${import.meta.env.VITE_EMAIL_ADDRESS}`}>{import.meta.env.VITE_EMAIL_ADDRESS}</a>
          </div>
        </div>
      )
    }
  </div>;
};
