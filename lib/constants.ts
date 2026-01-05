export const webinarType = [
  { value: "USI Webinar", label: "USI Webinar" },
  { value: "Smart Learning Program", label: "Smart Learning Program" },
  { value: "Live Operative Workshops", label: "Live Operative Workshops" },
] as const;

export const conferenceType = [
  { value: "Virtual", label: "Virtual" },
  { value: "Physical", label: "Physical" },
] as const;

export const registrationType = [
  { value: "paid", label: "Paid" },
  { value: "free", label: "Free" },
] as const;

export const status = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
] as const;

export const prefix = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Dr', label: 'Dr' },
  { value: 'Prof', label: 'Prof' },
] as const


export const facultyType = [
  { value: 'Convenor', label: 'Convenor' },
  { value: 'Co-Convenor', label: 'Co-Convenor' },
  { value: 'Faculty', label: 'Faculty' },
] as const


export const settingsList = [
  {
    key: "faculty",
    title: "Allow Faculty Access",
    desc: "Enable or disable faculty access to the platform features.",
  },
  {
    key: "faq",
    title: "Allow FAQs",
    desc: "Allow users to view frequently asked questions on the platform.",
  },
  {
    key: "feedback",
    title: "Allow Feedback",
    desc: "Enable or disable users from submitting feedback.",
  },
  {
    key: "quiz",
    title: "Allow Quiz",
    desc: "Allow users to participate in quizzes and assessments.",
  },
  {
    key: "meeting",
    title: "Allow Meetings",
    desc: "Enable or disable access to meetings and virtual sessions.",
  },
  {
    key: "question",
    title: "Allow Questions",
    desc: "Allow users to submit questions through the platform.",
  },
] as const;
