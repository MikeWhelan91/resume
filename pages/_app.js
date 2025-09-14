import "../styles/globals.css";
import "../styles/modern.css";
import "../styles/resume.css";
import "../styles/results.css";
import Head from "next/head";
import Navbar from "../components/ui/Navbar";
import Footer from "../components/ui/Footer";
import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import CookieBanner from "../components/ui/CookieBanner";

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <LanguageProvider>
          <Head>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta
            name="description"
            content="TailoredCV.app generates ATS-friendly resumes and cover letters tailored to any job description, cross-referencing skills to avoid fabricated proficiency, with customizable templates, real-time rendering, and one-click PDF downloads."
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

          <title>TailoredCV.app</title>
        </Head>
          <div className="min-h-screen flex flex-col bg-bg">
            <Navbar />
            <main className="flex-1">
              <Component {...pageProps} />
            </main>
            <Footer />
            <CookieBanner />
          </div>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
