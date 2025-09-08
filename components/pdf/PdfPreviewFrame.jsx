import { BlobProvider } from "@react-pdf/renderer";

export default function PdfPreviewFrame({ doc, title }) {
  return (
    <div className="h-[80vh] rounded-xl shadow border bg-white overflow-hidden">
      <BlobProvider document={doc}>
        {({ url, loading, error }) => {
          if (loading) return <div className="p-4 text-sm text-zinc-600">Rendering preview…</div>;
          if (error)   return <div className="p-4 text-sm text-red-600">Preview error: {String(error)}</div>;
          // Try to hide browser toolbars in Chromium/Edge (Firefox ignores these params)
          const src = url ? `${url}#view=FitH&toolbar=0&navpanes=0&scrollbar=0` : "";
          return (
            <iframe
              title={title || "PDF preview"}
              src={src}
              className="w-full h-full border-0"
            />
          );
        }}
      </BlobProvider>
    </div>
  );
}
