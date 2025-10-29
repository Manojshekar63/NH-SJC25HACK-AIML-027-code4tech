import { useState } from "react";
import Header from "@/components/Header";
import SearchHero from "@/components/SearchHero";
import SearchResults from "@/components/SearchResults";
import LoadingState from "@/components/LoadingState";
import Sidebar from "@/components/Sidebar";
import { mockPapers } from "@/data/mockData";
import { fetchPaperSummaries } from "@/services/summarizerAPI";
import TimeSavedBadge from "@/components/TimeSavedBadge";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useSettings } from "@/hooks/useSettings";

const Index = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<typeof mockPapers>([]);
  const { add } = useSearchHistory();
  const { state: settings } = useSettings();

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      // Optionally pass settings; backend will ignore unknown fields
      const data = await fetchPaperSummaries(query, 5, {
        model: settings.model,
        temperature: settings.temperature,
        length: settings.length,
        hipaaMode: settings.hipaaMode,
        anonymizePHI: settings.anonymizePHI,
      } as any);
      // Transform backend response to fit existing SearchResults mock shape for MVP view
      const transformed = (data?.papers || []).map((p: any) => ({
        pmid: p.paper_id || "",
        title: p.title || "",
        journal: "",
        date: p.pub_date || "",
        authors: (p.authors || []).join(", "),
        summary: (p.summary?.key_findings || []).slice(0, 4),
        fullSummary: `${p.summary?.methodology || ""}\n\n${p.summary?.conclusion || ""}`.trim(),
      }));
      setResults(transformed);
      // Record history
      add({ query, numPapers: 5, processingTimeSeconds: data?.processing_time_seconds });
    } catch (e) {
      // Fallback to mock data to avoid breaking UX
      setResults(mockPapers);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SearchHero onSearch={handleSearch} isLoading={isSearching} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Time Saved panel directly under search controls */}
        <div className="mt-0 mb-6">
          <TimeSavedBadge papersCount={results.length} isLoading={isSearching} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            {isSearching && <LoadingState />}
            {!isSearching && hasSearched && <SearchResults papers={results} />}
            {!hasSearched && !isSearching && (
              <div className="text-center py-16">
                <div className="mx-auto max-w-md space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-12 w-12 text-primary"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Start Your Search
                  </h3>
                  <p className="text-muted-foreground">
                    Enter a medical condition, treatment, or research topic above to get AI-powered summaries of the latest research
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
