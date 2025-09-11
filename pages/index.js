import Head from 'next/head';
import HeroUpload from '../components/ui/HeroUpload';

export default function Home(){
  return (
    <>
      <Head>
        <title>TailoredCV.app – AI-Powered Resume Optimization</title>
        <meta name="description" content="Create ATS-friendly resumes and cover letters with AI. Upload your existing resume or start from scratch - get hired faster with professionally tailored documents." />
      </Head>
      <HeroUpload />
    </>
  );
}
