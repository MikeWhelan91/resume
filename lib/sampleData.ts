export const sampleCV = {
  name: 'Alex Example',
  title: 'Software Engineer',
  contact: 'alex@example.com · Dublin, IE · github.com/alex',
  summary: 'Engineer focused on reliable systems and DX.',
  experience: [
    { company: 'Acme Corp', role: 'Senior Engineer', dates: '2022–Present', bullets: ['Led migration to unified React-PDF export', 'Improved API performance by 35%'] },
    { company: 'Widgets Ltd', role: 'Engineer', dates: '2019–2022', bullets: ['Built CV/CL generator', 'On-call SRE rotation'] }
  ],
  skills: ['TypeScript','React','Next.js','Node','SQL'],
  education: [{ school: 'Uni of Somewhere', award: 'BSc Computer Science', dates: '2015–2019' }]
}

export const sampleCL = {
  applicantName: 'Alex Example',
  address: '123 Example Road, Dublin',
  date: '8 September 2025',
  recipient: 'Hiring Manager, Example Co.',
  body: 'I am excited to apply. My recent work aligns closely with the role requirements. I have shipped resilient PDF pipelines and care about user experience and correctness.',
  signoff: 'Kind regards,'
}
