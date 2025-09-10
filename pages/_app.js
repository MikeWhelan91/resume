import "../styles/globals.css";
import "../styles/resume.css";
import "../styles/results.css";
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="description"
          content="TailorCV generates ATS-friendly resumes and cover letters tailored to any job description, cross-referencing skills to avoid fabricated proficiency, with customizable templates and real-time rendering."
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
      <style jsx global>{`body { background: #f6f7f9; }`}</style>
      <Component {...pageProps} />
    </>
  );
}
