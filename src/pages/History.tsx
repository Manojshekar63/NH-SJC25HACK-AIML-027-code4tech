import { useSearchHistory } from "@/hooks/useSearchHistory";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function groupLabel(date: Date): string {
  const now = new Date();
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This week";
  return "Older";
}

const dtf = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

const History = () => {
  const { items, remove, clear, restore } = useSearchHistory();
  const navigate = useNavigate();

  const grouped = items.reduce<Record<string, typeof items>>((acc, it) => {
    const label = groupLabel(new Date(it.timestamp));
    acc[label] = acc[label] || [];
    acc[label].push(it);
    return acc;
  }, {});

  const onRunAgain = (id: string) => {
    const item = items.find((x) => x.id === id);
    if (!item) return;
    const payload = restore(item);
    navigate("/", { state: payload });
  };

  const onCopy = async (q: string) => {
    try { await navigator.clipboard.writeText(q); } catch {}
  };

  const onClearAll = () => {
    if (confirm("Clear all search history?")) clear();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Recent Searches</h2>
          <Button variant="outline" size="sm" onClick={onClearAll}>Clear all</Button>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No searches yet. Run a search to see it here.</div>
        ) : (
          <div className="space-y-8" role="list">
            {Object.entries(grouped).map(([label, list]) => (
              <div key={label} className="space-y-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="divide-y rounded-md border bg-card">
                  {list.map((it) => (
                    <div key={it.id} className="flex items-center justify-between p-4 gap-4">
                      <div className="min-w-0">
                        <div className="text-sm text-foreground truncate">{it.query}</div>
                        <div className="text-xs text-muted-foreground">
                          {dtf.format(new Date(it.timestamp))} • {it.numPapers} {it.numPapers === 1 ? "paper" : "papers"}
                          {typeof it.processingTimeSeconds === "number" ? ` • ~${it.processingTimeSeconds.toFixed(1)}s processing` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="sm" aria-label="Run again" onClick={() => onRunAgain(it.id)}>
                          <RotateCcw className="h-4 w-4 mr-1" /> Run again
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Copy query" onClick={() => onCopy(it.query)}>
                          <Copy className="h-4 w-4 mr-1" /> Copy
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Delete" onClick={() => remove(it.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
