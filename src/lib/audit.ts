export type AuditType = 'search' | 'summarize' | 'export' | 'copy';
export interface AuditEvent { ts: string; type: AuditType; payload?: Record<string, unknown> }

const KEY = 'medlit.audit.v1';
const CAP = 200;

function read(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return [] }
}

function write(events: AuditEvent[]) {
  try { localStorage.setItem(KEY, JSON.stringify(events)); } catch {}
}

export function logEvent(type: AuditType, payload?: Record<string, unknown>) {
  const events = read();
  events.unshift({ ts: new Date().toISOString(), type, payload });
  if (events.length > CAP) events.length = CAP;
  write(events);
}

export function readEvents(): AuditEvent[] { return read(); }
