import '../styles/globals.css';
import '../styles/resume.css';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="description"
          content="TailorCV generates ATS-friendly resumes and cover letters with side-by-side preview and customizable templates."
        />
        <title>TailorCV</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
