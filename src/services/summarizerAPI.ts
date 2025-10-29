export async function fetchPaperSummaries(query: string, numPapers: number = 5, opts?: Record<string, unknown>) {
	const body = JSON.stringify({ query, num_papers: numPapers, ...(opts || {}) });
	const headers = { "Content-Type": "application/json" } as const;

	let lastError: any = null;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const res = await fetch("/api/summarize/search", {
				method: "POST",
				headers,
				body,
			});
			if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
			return await res.json();
		} catch (e) {
			lastError = e;
			await new Promise((r) => setTimeout(r, attempt * 300));
		}
	}
	throw lastError ?? new Error("Network error");
}
