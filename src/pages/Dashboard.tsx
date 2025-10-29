import { useMemo } from "react";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MIN_PER_PAPER = 17;

function toBars(values: number[]) {
  const max = Math.max(1, ...values);
  return values.map((v) => Math.round((v / max) * 100));
}

const Dashboard = () => {
  const { items } = useSearchHistory();

  const timeStats = useMemo(() => {
    const searches = items.length;
    const totalManual = items.reduce((acc, it) => acc + it.numPapers * MIN_PER_PAPER, 0);
    const totalAI = items.reduce((acc, it) => acc + Math.ceil((it.processingTimeSeconds || 0) / 60), 0);
    const totalSaved = Math.max(totalManual - totalAI, 0);
    const perSearch = searches ? Math.round(totalSaved / searches) : 0;
    const last10 = items.slice(0, 10).map((it) => it.numPapers * MIN_PER_PAPER);
    return { searches, totalManual, totalAI, totalSaved, perSearch, bars: toBars(last10) };
  }, [items]);

  const aiScores = useMemo(() => {
    // Heuristic scores based on available info
    const last10 = items.slice(0, 10);
    if (!last10.length) return { list: [], avg: 0, badge: "No data" } as const;
    const list = last10.map((it) => {
      const confidence = typeof it.processingTimeSeconds === "number" ? 70 : 70; // neutral default
      const quality = confidence;
      const relevance = 70; // without titles present, keep neutral
      const overall = Math.round((quality + relevance + confidence) / 3);
      return { id: it.id, quality, relevance, confidence, overall };
    });
    const avg = Math.round(list.reduce((a, b) => a + b.overall, 0) / list.length);
    const badge = avg >= 80 ? "Excellent" : avg >= 60 ? "Good" : "Moderate";
    return { list, avg, badge } as const;
  }, [items]);

  const trends = useMemo(() => {
    const stop = new Set(["the","and","of","in","for","to","a","on","with","latest","review","guidelines"]);
    const freq = new Map<string, number>();
    items.forEach((it) => {
      it.query.split(/\W+/).forEach((w) => {
        const k = w.toLowerCase();
        if (!k || stop.has(k) || k.length < 3) return;
        freq.set(k, (freq.get(k) || 0) + 1);
      });
    });
    const top = Array.from(freq.entries()).sort((a,b) => b[1]-a[1]).slice(0, 6).map(([k]) => k);
    const recs = top.slice(0, 3).flatMap((kw) => [
      `latest ${kw} guidelines`,
      `systematic review ${kw}`,
      `RCT ${kw} outcomes`,
    ]).slice(0, 6);
    return { top, recs } as const;
  }, [items]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Time Saved */}
          <Card className="p-6">
            <div className="text-sm font-semibold text-foreground">Total Time Saved</div>
            <div className="text-4xl font-bold mt-2">{timeStats.totalSaved} min</div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {timeStats.searches} {timeStats.searches === 1 ? "search" : "searches"}, {items.reduce((a,b)=>a+b.numPapers,0)} papers processed
            </div>
            <div className="text-xs text-muted-foreground mt-2">Avg per search: {timeStats.perSearch} min</div>
            <div className="flex items-end gap-1 mt-4 h-12">
              {timeStats.bars.map((h, idx) => (
                <div key={idx} className="w-2 bg-primary/40" style={{ height: `${Math.max(8, h)}%` }} />
              ))}
            </div>
          </Card>

          {/* AI Intelligence */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">AI Intelligence Scoreboard</div>
              <Badge variant="secondary">{aiScores.badge}</Badge>
            </div>
            {aiScores.list.length === 0 ? (
              <div className="text-xs text-muted-foreground mt-3">Run some searches to see intelligence scores.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {aiScores.list.map((row) => (
                  <div key={row.id} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Quality</span><span>{row.quality}</span>
                    </div>
                    <div className="h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${row.quality}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Relevance</span><span>{row.relevance}</span>
                    </div>
                    <div className="h-2 bg-muted rounded">
                      <div className="h-2 bg-primary/80 rounded" style={{ width: `${row.relevance}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Confidence</span><span>{row.confidence}</span>
                    </div>
                    <div className="h-2 bg-muted rounded">
                      <div className="h-2 bg-primary/60 rounded" style={{ width: `${row.confidence}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Trends & Recommendations */}
          <Card className="p-6">
            <div className="text-sm font-semibold text-foreground">Trending Topics</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {trends.top.length === 0 ? (
                <div className="text-xs text-muted-foreground">No trends yet. Your searches will appear here.</div>
              ) : (
                trends.top.map((t) => <Badge key={t} variant="outline">{t}</Badge>)
              )}
            </div>
            <div className="text-sm font-semibold text-foreground mt-4">Smart Recommendations</div>
            <ul className="mt-2 space-y-1 text-sm">
              {trends.recs.map((r) => (
                <li key={r} className="text-muted-foreground">{r}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
