import '../styles/globals.css';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="description" content="TailorCV helps you generate tailored resumes and cover letters." />
        <title>TailorCV</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
