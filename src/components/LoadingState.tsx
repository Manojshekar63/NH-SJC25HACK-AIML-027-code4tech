import { Card } from "@/components/ui/card";
import { Loader2, Search, Brain, FileText } from "lucide-react";

const LoadingState = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Processing Your Search
            </h3>
            <p className="text-sm text-muted-foreground">
              This may take a few moments...
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Search className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Searching PubMed</p>
                <p className="text-sm text-muted-foreground">Finding relevant research papers...</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Retrieving Papers</p>
                <p className="text-sm text-muted-foreground">Fetching full abstracts and metadata...</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Brain className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">AI Summarization</p>
                <p className="text-sm text-muted-foreground">Extracting key findings and insights...</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoadingState;
