// pages/api/export-docx.js
import { Document, Packer, Paragraph } from "docx";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { filename = "document.docx", content = "" } = req.body || {};
    const lines = String(content || "").split(/\r?\n/);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: lines.map((line) => new Paragraph({ children: [], text: line })),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/"/g, "")}"`);
    return res.send(Buffer.from(buffer));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to build .docx" });
  }
}
