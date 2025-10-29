import { useCallback, useEffect, useMemo, useState } from "react";

export interface HistoryItem {
  id: string;
  query: string;
  numPapers: number;
  timestamp: string; // ISO string
  processingTimeSeconds?: number;
}

const STORAGE_KEY = "medlit.history.v1";
const MAX_ITEMS = 100;
const DEDUP_WINDOW = 10; // de-dup within last N entries

function safeParse(json: string | null): HistoryItem[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as HistoryItem[];
    if (Array.isArray(arr)) return arr;
    return [];
  } catch {
    return [];
  }
}

function save(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors; operate in-memory
  }
}

function normalizeQuery(q: string): string {
  return (q || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function useSearchHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      setItems(safeParse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      setItems([]);
    }
  }, []);

  const add = useCallback((entry: { query: string; numPapers: number; processingTimeSeconds?: number }) => {
    const now = new Date().toISOString();
    const norm = normalizeQuery(entry.query);

    setItems((prev) => {
      const next = [...prev];
      // de-dup recent window
      const recent = next.slice(0, DEDUP_WINDOW);
      const dupIdx = recent.findIndex((it) => normalizeQuery(it.query) === norm);
      if (dupIdx !== -1) {
        const existing = { ...recent[dupIdx], timestamp: now, numPapers: entry.numPapers, processingTimeSeconds: entry.processingTimeSeconds };
        next.splice(dupIdx, 1);
        next.unshift(existing);
      } else {
        next.unshift({ id: crypto.randomUUID(), query: entry.query, numPapers: entry.numPapers, timestamp: now, processingTimeSeconds: entry.processingTimeSeconds });
      }
      if (next.length > MAX_ITEMS) next.length = MAX_ITEMS;
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems(() => {
      save([]);
      return [];
    });
  }, []);

  const restore = useCallback((item: HistoryItem) => ({ query: item.query, numPapers: item.numPapers }), []);

  return useMemo(() => ({ items, add, remove, clear, restore }), [items, add, remove, clear, restore]);
}
