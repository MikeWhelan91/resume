import { useEffect, useState } from "react";
import PageCarousel from "@/components/ui/PageCarousel";
import LightboxModal from "@/components/ui/LightboxModal";

export default function ResultsPage() {
  const [resumePages, setResumePages] = useState([]);
  const [coverPages, setCoverPages] = useState([]);
  const [rIndex, setRIndex] = useState(0);
  const [cIndex, setCIndex] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let data = null;
    try { data = JSON.parse(localStorage.getItem("resumeResult") || "null"); } catch {}
    if (data) {
      setResumePages([<div className="p-6">{JSON.stringify(data.resumeData)}</div>]);
      setCoverPages([<div className="p-6 whitespace-pre-line">{data.coverLetter}</div>]);
    }
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto px-6 py-8 max-w-[1600px]">
        <header className="mb-6 flex items-end justify-between">
          <h1 className="text-2xl font-semibold">Preview</h1>
        </header>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <PageCarousel
            title="Résumé"
            pages={resumePages}
            index={rIndex}
            setIndex={setRIndex}
            onOpenLightbox={() => setLightbox({ type: "resume", index: rIndex })}
          />
          <PageCarousel
            title="Cover Letter"
            pages={coverPages}
            index={cIndex}
            setIndex={setCIndex}
            onOpenLightbox={() => setLightbox({ type: "cover", index: cIndex })}
          />
        </div>
      </div>

      <LightboxModal
        open={!!lightbox}
        onClose={() => setLightbox(null)}
        onPrev={() => {
          if (!lightbox) return;
          if (lightbox.type === "resume") setRIndex(i => Math.max(0, i - 1));
          if (lightbox.type === "cover") setCIndex(i => Math.max(0, i - 1));
        }}
        onNext={() => {
          if (!lightbox) return;
          if (lightbox.type === "resume") setRIndex(i => Math.min(resumePages.length - 1, i + 1));
          if (lightbox.type === "cover") setCIndex(i => Math.min(coverPages.length - 1, i + 1));
        }}
        canPrev={lightbox?.type === "resume" ? rIndex > 0 : cIndex > 0}
        canNext={lightbox?.type === "resume" ? rIndex < resumePages.length - 1 : cIndex < coverPages.length - 1}
        pageLabel={lightbox ? `${lightbox.type === "resume" ? rIndex + 1 : cIndex + 1} / ${lightbox.type === "resume" ? resumePages.length : coverPages.length}` : ""}
      >
        {lightbox?.type === "resume" ? resumePages[rIndex] : coverPages[cIndex]}
      </LightboxModal>
    </main>
  );
}
