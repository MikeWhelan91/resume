import "../styles/globals.css";
import "../styles/resume.css";
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="description"
          content="TailorCV generates ATS-friendly resumes and cover letters with side-by-side and fullscreen previews plus customizable templates."
        />
        <link
          rel="preload"
          href="/fonts/Inter-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Inter-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Inter-SemiBold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Inter-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        <title>TailorCV</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
