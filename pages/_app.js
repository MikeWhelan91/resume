import "../styles/globals.css";
import "../styles/modern.css";
import "../styles/resume.css";
import "../styles/results.css";
import Head from "next/head";
import Navbar from "../components/ui/Navbar";
import Footer from "../components/ui/Footer";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="description"
          content="TailorCV generates ATS-friendly resumes and cover letters tailored to any job description, cross-referencing skills to avoid fabricated proficiency, with customizable templates, real-time rendering, and one-click PDF downloads."
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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Navbar />
        <main className="flex-1">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </>
  );
}
