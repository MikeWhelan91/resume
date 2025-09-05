import { Document, Packer, Paragraph, TextRun } from "docx";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { coverLetter, filename = "cover_letter" } = body;
    if (!coverLetter) return res.status(400).json({ error: "Missing coverLetter" });

    const lines = String(coverLetter).split(/\n+/).map((line) => new Paragraph({ children: [new TextRun(line)] }));
    const doc = new Document({ sections: [{ properties: {}, children: lines }] });
    const buffer = await Packer.toBuffer(doc);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${String(filename).replace(/"/g, "")}.docx"`);
    return res.send(Buffer.from(buffer));
  } catch (e) {
    return res.status(500).json({ error: "Export failed", detail: String(e?.message || e) });
  }
}
