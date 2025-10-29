import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const exampleQueries = [
  "Latest diabetes treatment guidelines",
  "COVID-19 long-term effects",
  "Hypertension management 2024",
  "Immunotherapy for melanoma",
];

interface SearchHeroProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchHero = ({ onSearch, isLoading }: SearchHeroProps) => {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    onSearch(example);
  };

  return (
    <div className="w-full bg-gradient-to-br from-primary/5 via-background to-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Search Medical Literature
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              AI-powered summaries of the latest research from PubMed
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search medical research (e.g., 'latest diabetes treatment guidelines')"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-12 text-base bg-card shadow-sm"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="h-12 px-8 font-semibold"
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            {showFilters && (
              <div className="rounded-lg border bg-card p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date Range</label>
                    <select className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      <option>Last year</option>
                      <option>Last 5 years</option>
                      <option>Last 10 years</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Article Type</label>
                    <select className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      <option>All types</option>
                      <option>Clinical trials</option>
                      <option>Meta-analysis</option>
                      <option>Review</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 rounded" />
                      <span className="text-sm font-medium">Open access only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {exampleQueries.map((example) => (
                <Badge
                  key={example}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHero;
