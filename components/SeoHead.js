import Head from 'next/head';

export default function SeoHead({
  title = 'TailoredCV.app – AI-Powered Resume Optimization',
  description = 'Create ATS-friendly resumes and cover letters with AI. Upload your existing resume or start from scratch - get hired faster with professionally tailored documents.',
  keywords = 'AI resume, ATS resume, cover letter generator, professional CV, TailoredCV',
  canonical = 'https://tailoredcv.app',
  ogImage = 'https://tailoredcv.app/og-image.png',
  robots = 'index,follow',
}) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}
