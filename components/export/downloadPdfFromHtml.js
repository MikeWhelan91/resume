export async function downloadPdfFromHtml(htmlString, filename = "document.pdf") {
  const res = await fetch("/api/export-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: htmlString })
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error("Export failed: " + t);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
