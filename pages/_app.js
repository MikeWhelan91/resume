import '../styles/globals.css';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>TailorCV</title>
      </Head>
      <div className="min-h-screen bg-bg text-text">
        <Component {...pageProps} />
      </div>
    </>
  );
}
