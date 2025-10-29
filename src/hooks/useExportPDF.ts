import { useCallback, useState } from "react";
import { exportPaperToPDF, PdfPaper } from "@/lib/exportPdf";

export function useExportPDF() {
  const [exporting, setExporting] = useState(false);

  const exportOne = useCallback(async (paper: PdfPaper) => {
    try {
      setExporting(true);
      await exportPaperToPDF(paper);
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, exportOne } as const;
}
