import Head from 'next/head';
import HeroUpload from '../components/ui/HeroUpload';
import Benefit from '../components/ui/Benefit';
import Section from '../components/ui/Section';

export default function Home(){
  const github = process.env.NEXT_PUBLIC_GITHUB_URL;
  return (
    <>
      <Head>
        <title>TailorCV – ATS-ready CV</title>
        <meta name="description" content="Upload your CV, paste a job description, and get a tailored CV plus cover letter." />
      </Head>
      <header className="max-w-5xl mx-auto flex justify-between items-center p-4">
        <div className="font-bold text-xl">TailorCV</div>
        {github && <a href={github} className="tc-btn-link">GitHub</a>}
      </header>
      <main>
        <HeroUpload />
        <Section>
          <h2 className="text-2xl font-semibold text-center mb-8">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <Benefit icon="upload" heading="Import" body="Upload a PDF/DOCX or paste your CV text." />
            <Benefit icon="bolt" heading="Tailor" body="Add the job description; we align keywords without fabricating experience." />
            <Benefit icon="stars" heading="Export" body="Download ATS-friendly PDF or DOCX, or use a styled template." />
          </div>
        </Section>
        <Section>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <Benefit icon="stars" heading="ATS friendly" body="Semantic structure, clean fonts, no tables or images." />
            <Benefit icon="shield" heading="Privacy first" body="Processed in memory, then gone." />
            <Benefit icon="bolt" heading="Straight pricing" body="Free preview and PDF export. DOCX optional." />
          </div>
        </Section>
      </main>
      <footer className="text-center text-sm text-[var(--muted)] py-8">© 2024 TailorCV</footer>
    </>
  );
}
