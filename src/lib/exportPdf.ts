import jsPDF from "jspdf";
import "jspdf-autotable";

export interface PdfPaper {
  title: string;
  pmid?: string;
  journal?: string;
  date?: string;
  authors?: string;
  keyFindings?: string[];
  methodology?: string;
  conclusion?: string;
  abstract?: string;
}

function sanitize(text?: string): string {
  if (!text) return "";
  return text
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text: string): string {
  return sanitize(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "-" +
    pad(d.getHours()) +
    pad(d.getMinutes())
  );
}

function addHeaderFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    (doc as any).setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120);
    // Header
    doc.text(
      `MedLit AI – Research Summary  |  ${new Date().toLocaleString()}`,
      14,
      10
    );
    // Footer with page numbers
    const pageLabel = `Page ${i} of ${pageCount}`;
    const w = (doc as any).internal.pageSize.getWidth();
    doc.text(pageLabel, w - 14 - doc.getTextWidth(pageLabel), (doc as any).internal.pageSize.getHeight() - 10);
  }
}

export async function exportPaperToPDF(paper: PdfPaper): Promise<void> {
  if (typeof window === "undefined") return;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const marginLeft = 14;
  const marginTop = 18;
  const maxWidth = (doc as any).internal.pageSize.getWidth() - marginLeft * 2;

  doc.setFontSize(11);
  doc.setTextColor(20);

  // Title
  const title = sanitize(paper.title) || "Untitled";
  doc.setFont(undefined, "bold");
  doc.setFontSize(16);
  doc.text(title, marginLeft, marginTop, { maxWidth });

  let cursorY = marginTop + 8;

  // Metadata line
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  const metaParts: string[] = [];
  if (paper.journal) metaParts.push(sanitize(paper.journal));
  if (paper.date) metaParts.push(sanitize(paper.date));
  if (paper.pmid) metaParts.push(`PMID: ${sanitize(paper.pmid)}`);
  const meta = metaParts.join(" • ");
  if (meta) {
    doc.text(meta, marginLeft, cursorY, { maxWidth });
    cursorY += 7;
  }

  // Authors
  const authors = sanitize(paper.authors);
  if (authors) {
    const lines = doc.splitTextToSize(authors, maxWidth);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * 6 + 2;
  }

  // Helper to add section header
  const addSection = (label: string) => {
    doc.setFont(undefined, "bold");
    doc.text(label, marginLeft, cursorY);
    doc.setFont(undefined, "normal");
    cursorY += 6;
  };

  // Key Findings as bullets
  const kf = (paper.keyFindings || []).map(sanitize).filter(Boolean).slice(0, 10);
  if (kf.length) {
    addSection("Key Findings");
    kf.forEach((item) => {
      const bullet = `• ${item}`;
      const lines = doc.splitTextToSize(bullet, maxWidth);
      // Add page break if needed
      const pageHeight = (doc as any).internal.pageSize.getHeight();
      if (cursorY + lines.length * 6 > pageHeight - 14) {
        doc.addPage();
        cursorY = marginTop;
      }
      doc.text(lines, marginLeft, cursorY);
      cursorY += lines.length * 6;
    });
    cursorY += 2;
  }

  // Methodology
  const methodology = sanitize(paper.methodology);
  if (methodology) {
    addSection("Methodology");
    const lines = doc.splitTextToSize(methodology, maxWidth);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * 6 + 2;
  }

  // Conclusion
  const conclusion = sanitize(paper.conclusion);
  if (conclusion) {
    addSection("Conclusion");
    const lines = doc.splitTextToSize(conclusion, maxWidth);
    doc.text(lines, marginLeft, cursorY);
    cursorY += lines.length * 6 + 2;
  }

  // Abstract fallback
  if (!kf.length && !methodology && !conclusion) {
    const abstract = sanitize((paper.abstract || "").slice(0, 1200));
    if (abstract) {
      addSection("Abstract");
      const lines = doc.splitTextToSize(abstract, maxWidth);
      doc.text(lines, marginLeft, cursorY);
      cursorY += lines.length * 6 + 2;
    }
  }

  addHeaderFooter(doc);

  const filename = `${slugify(title) || "summary"}_PMID-${paper.pmid || "NA"}_${nowStamp()}.pdf`;
  doc.save(filename);
  return Promise.resolve();
}
