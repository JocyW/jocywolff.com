import { JSX } from 'solid-js';

export const Skill = ({ children }) => {
  return <span class="border-dark-green border-2 rounded-full px-2 py-0.5">
        {children}
    </span>;
};
type ExperienceEntryProps = {
  company: string,
  title: string,
  startDate: string,
  endDate: string,
  location: string,
  children: JSX.Element,
  skills?: string[]
}

export const ExperienceEntry = (
  {
    company,
    title,
    startDate,
    endDate,
    location,
    children,
    skills
  }: ExperienceEntryProps) => {
  return <div class="break-inside-avoid-page">
    <h4>
      <b>{company}</b> / {title}
    </h4>
    <div class="text-gray-400 uppercase">
      {startDate} - {endDate}, {location}
    </div>
    <div class="pt-1">
      {children}
    </div>
    {
      skills && <div class="flex gap-x-1 gap-y-1 pt-1 items-start flex-wrap print:text-xs text-sm leading-tight">
        {skills.map((skill) => <Skill>{skill}</Skill>)}
      </div>
    }
  </div>;
};