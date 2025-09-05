import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>TailorCV - Smart Resume Builder</title>
        <meta name="description" content="Build or import your resume with TailorCV's smart tools." />
      </Head>
      <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
        <h1 className="text-3xl font-bold">TailorCV</h1>
        <div className="flex flex-col md:flex-row gap-4">
          <Link href="/import" className="bg-blue-600 text-white px-6 py-3 rounded-md text-center">Upload a CV</Link>
          <Link href="/builder" className="bg-green-600 text-white px-6 py-3 rounded-md text-center">Build a New CV</Link>
        </div>
        <div className="mt-8 text-sm">
          <Link href="/advanced" className="text-gray-500 underline">Advanced: original generate flow</Link>
        </div>
      </main>
    </>
  );
}
