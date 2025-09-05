import Head from 'next/head';
import Link from 'next/link';
import { templateList } from '../components/templates';

export default function TemplatesPage() {
  return (
    <>
      <Head>
        <title>Templates - TailorCV</title>
        <meta name="description" content="Browse resume templates." />
      </Head>
      <main className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Templates</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templateList.map(id => (
            <Link key={id} href="/builder" className="border p-4 text-center hover:bg-gray-50">
              {id}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
