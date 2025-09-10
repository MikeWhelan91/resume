import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ResumeWizard from '../components/ResumeWizard';

export default function WizardPage(){
  const router = useRouter();
  const [initial, setInitial] = useState(undefined);
  const [template, setTemplate] = useState('classic');

  useEffect(()=>{
    let saved = null;
    try{ saved = JSON.parse(localStorage.getItem('resumeWizardDraft')||'null'); }catch{}
    setInitial(saved || null);
  },[]);

  function handleComplete(result){
    localStorage.setItem('resumeResult', JSON.stringify(result));
    router.push('/results');
  }

  if(initial === undefined) return null;

  return (
    <>
      <Head>
        <title>Resume Wizard – TailorCV</title>
        <meta name="description" content="Step-by-step CV builder with real-time template rendering and one-click PDF downloads." />
      </Head>
      <ResumeWizard initialData={initial} onComplete={handleComplete} autosaveKey="resumeWizardDraft" template={template} onTemplateChange={setTemplate} />
    </>
  );
}
