import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Bookmark, TrendingUp } from "lucide-react";

const Sidebar = () => {
  const recentSearches = [
    "Latest diabetes treatment guidelines",
    "COVID-19 long-term effects",
    "Hypertension management 2024",
  ];

  return (
    <aside className="w-full lg:w-80 space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Recent Searches</h3>
        </div>
        <div className="space-y-2">
          {recentSearches.map((search, idx) => (
            <button
              key={idx}
              className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-muted/50"
            >
              {search}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">Saved Summaries</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-3xl font-bold text-foreground">12</p>
          <p className="text-sm text-muted-foreground mt-1">Papers bookmarked</p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Today's Activity</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Papers analyzed</span>
            <Badge variant="secondary">8</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Searches</span>
            <Badge variant="secondary">3</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Exports</span>
            <Badge variant="secondary">2</Badge>
          </div>
        </div>
      </Card>
    </aside>
  );
};

export default Sidebar;
