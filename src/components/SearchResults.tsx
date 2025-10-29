import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  FileDown,
  Volume2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useTTS } from "@/hooks/useTTS";
import { useExportPDF } from "@/hooks/useExportPDF";

interface Paper {
  pmid: string;
  title: string;
  journal: string;
  date: string;
  summary: string[];
  fullSummary: string;
  authors: string;
}

interface SearchResultsProps {
  papers: Paper[];
}

const SearchResults = ({ papers }: SearchResultsProps) => {
  const [expandedPapers, setExpandedPapers] = useState<Set<string>>(new Set());
  const { toggle, speaking, supported, setVoiceByName } = useTTS({ voiceHint: "en" });
  const { exporting, exportOne } = useExportPDF();

  // Prefer a specific MS voice if available
  useMemo(() => {
    setVoiceByName("Microsoft Zira Desktop - English (United States)");
  }, [setVoiceByName]);

  const toggleExpand = (pmid: string) => {
    const newExpanded = new Set(expandedPapers);
    if (newExpanded.has(pmid)) {
      newExpanded.delete(pmid);
    } else {
      newExpanded.add(pmid);
    }
    setExpandedPapers(newExpanded);
  };

  if (papers.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Research Summaries</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Found {papers.length} relevant papers
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {papers.map((paper) => {
          const isExpanded = expandedPapers.has(paper.pmid);

          const ttsText = useMemo(() => {
            const parts: string[] = [];
            if (paper.title) parts.push(paper.title);
            if (paper.summary && paper.summary.length) {
              parts.push("Key Findings: " + paper.summary.join("; "));
            }
            if (paper.fullSummary) {
              parts.push("Full Summary: " + paper.fullSummary);
            }
            const combined = parts.join(". ");
            return combined && combined.length > 0 ? combined : (paper.fullSummary || "").slice(0, 800);
          }, [paper]);

          const onExport = () => {
            const paperData = {
              title: paper.title,
              pmid: paper.pmid,
              journal: paper.journal,
              date: paper.date,
              authors: paper.authors,
              keyFindings: paper.summary,
              // Best-effort methodology/conclusion extraction from fullSummary
              methodology: undefined,
              conclusion: undefined,
              abstract: paper.fullSummary,
            };
            exportOne(paperData);
          };

          return (
            <Card key={paper.pmid} className="p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <h4 className="text-lg font-semibold text-foreground leading-tight flex-1">
                        {paper.title}
                      </h4>
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{paper.journal}</Badge>
                      <span>•</span>
                      <span>{paper.date}</span>
                      <span>•</span>
                      <span className="text-xs">PMID: {paper.pmid}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{paper.authors}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <h5 className="text-sm font-semibold text-foreground">Key Findings</h5>
                  </div>
                  <ul className="space-y-2 pl-3">
                    {paper.summary.map((point, idx) => (
                      <li key={idx} className="text-sm text-foreground flex gap-2">
                        <span className="text-primary font-medium shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isExpanded && (
                  <div className="space-y-3 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h5 className="text-sm font-semibold text-foreground">Full Summary</h5>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{paper.fullSummary}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpand(paper.pmid)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Full Summary
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" disabled={exporting} onClick={onExport}>
                    <FileDown className="h-4 w-4 mr-1" />
                    {exporting ? "Exporting…" : "Export"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={supported === false}
                    aria-pressed={speaking}
                    onClick={() => toggle(ttsText)}
                    title={supported === false ? "Text-to-speech not supported" : undefined}
                  >
                    <Volume2 className="h-4 w-4 mr-1" />
                    {speaking ? "Listening…" : "Listen"}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
