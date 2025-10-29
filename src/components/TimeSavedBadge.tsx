import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TimeSavedBadgeProps {
  papersCount: number;
  processingTimeSeconds?: number;
  isLoading: boolean;
}

// Tunable assumptions (minutes)
const MIN_PER_SEARCH = 2; // searching per paper found
const MIN_PER_READ = 10; // read/skim abstract
const MIN_PER_NOTES = 5; // manual notes/summarization

const MANUAL_PER_PAPER = MIN_PER_SEARCH + MIN_PER_READ + MIN_PER_NOTES; // 17

const plural = (n: number, s: string) => (n === 1 ? s : `${s}s`);

const Skeleton = () => (
  <div className="animate-pulse rounded-lg border bg-primary/5 p-4">
    <div className="h-4 w-40 bg-muted rounded" />
    <div className="mt-2 h-6 w-28 bg-muted rounded" />
    <div className="mt-2 h-3 w-72 bg-muted/70 rounded" />
  </div>
);

const TimeSavedBadge = ({ papersCount, processingTimeSeconds, isLoading }: TimeSavedBadgeProps) => {
  if (isLoading) return <Skeleton />;
  if (papersCount === 0) return null;

  const manualTotalMin = papersCount * MANUAL_PER_PAPER;
  const aiProcessingMin = Math.ceil((processingTimeSeconds || 0) / 60);
  const timeSavedMin = Math.max(manualTotalMin - aiProcessingMin, 0);

  const display = timeSavedMin < 1 ? "< 1 minute" : `${timeSavedMin} ${plural(timeSavedMin, "minute")}`;

  return (
    <div role="status" aria-live="polite" className="w-full">
      <div className="bg-primary/5 border rounded-lg p-3 md:p-4 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-foreground">Estimated Time Saved</div>
          <div className="text-2xl font-bold text-foreground">{display}</div>
          <div className="text-xs text-muted-foreground">
            Compared to manual PubMed search + abstract reading + note-taking for {papersCount} {plural(papersCount, "paper")}.
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button aria-label="How this is calculated" className="inline-flex items-center rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/30">
              <Info className="h-4 w-4 mr-1" />
              Details
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs text-xs">
              Assumptions: {MIN_PER_SEARCH}m search + {MIN_PER_READ}m reading + {MIN_PER_NOTES}m notes per paper. Your run time is subtracted from this estimate.
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default TimeSavedBadge;
