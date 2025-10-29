import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/hooks/useSettings";
import { readEvents } from "@/lib/audit";

const Settings = () => {
  const { state, setModel, setTemperature, setLength, setProfile, setHipaaMode, setResidency, setAnonymizePHI, setSchedule, addKeyword, removeKeyword } = useSettings();
  const [newKw, setNewKw] = useState("");
  const [tab, setTab] = useState<'model'|'profiles'|'privacy'>('model');

  const audit = useMemo(() => readEvents().slice(0, 50), []);

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ settings: state, audit }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'medlit-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const deleteData = () => {
    if (!confirm('Delete all local data?')) return;
    localStorage.removeItem('medlit.settings.v1');
    localStorage.removeItem('medlit.history.v1');
    localStorage.removeItem('medlit.audit.v1');
    location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>

        <div className="flex gap-2">
          <Button variant={tab==='model'?'default':'outline'} size="sm" onClick={() => setTab('model')}>Model & Summarization</Button>
          <Button variant={tab==='profiles'?'default':'outline'} size="sm" onClick={() => setTab('profiles')}>Research Profiles</Button>
          <Button variant={tab==='privacy'?'default':'outline'} size="sm" onClick={() => setTab('privacy')}>Privacy & Compliance</Button>
        </div>

        {tab==='model' && (
          <Card className="p-6 space-y-6">
            <div>
              <div className="text-sm font-semibold">Model</div>
              <div className="mt-2 flex items-center gap-2">
                <select className="h-9 rounded-md border bg-background px-3 text-sm" value={state.model} onChange={(e)=>setModel(e.target.value as any)}>
                  <option value="llama3.1">Llama 3.1 (local)</option>
                  <option value="gpt-4">GPT-4 (preview)</option>
                  <option value="claude">Claude (preview)</option>
                  <option value="biogpt">BioGPT (preview)</option>
                </select>
                {state.model !== 'llama3.1' && <Badge variant="secondary">Preview only</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Currently running on Llama 3.1 locally; other models are future options. We’ll fall back automatically.</p>
            </div>

            <div>
              <div className="text-sm font-semibold">Temperature</div>
              <input type="range" min={0} max={1} step={0.05} value={state.temperature} onChange={(e)=>setTemperature(parseFloat(e.target.value))} className="w-full" />
              <div className="text-xs text-muted-foreground">{state.temperature.toFixed(2)} • 0.1 factual • 0.7 balanced • 1.0 creative</div>
            </div>

            <div>
              <div className="text-sm font-semibold">Summary Length</div>
              <div className="mt-2 flex gap-2">
                {(['brief','standard','comprehensive'] as const).map((len) => (
                  <Button key={len} variant={state.length===len?'default':'outline'} size="sm" onClick={()=>setLength(len)}>
                    {len==='brief'?'Quick Brief':len==='standard'?'Standard':'Comprehensive'}
                  </Button>
                ))}
              </div>
            </div>

            <Card className="p-4">
              <div className="text-sm font-semibold">Model Performance (placeholder)</div>
              <div className="text-xs text-muted-foreground mt-1">Fastest: Llama 3.1 • Most accurate for medical: BioGPT (planned)</div>
            </Card>
          </Card>
        )}

        {tab==='profiles' && (
          <Card className="p-6 space-y-6">
            <div>
              <div className="text-sm font-semibold">Profiles</div>
              <div className="mt-2 flex gap-2">
                {['Cardiologist','PhD Student','Hospital Admin'].map((p)=> (
                  <Button key={p} variant={state.profile===p?'default':'outline'} size="sm" onClick={()=>{
                    setProfile(p);
                    if (p==='Cardiologist') { addKeyword('cardiology'); setSchedule('weekly'); }
                    if (p==='PhD Student') { addKeyword('systematic review'); setLength('comprehensive'); }
                    if (p==='Hospital Admin') { setLength('brief'); setSchedule('weekly'); setAnonymizePHI(true); }
                  }}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" onClick={()=>setProfile(null)}>Clear</Button>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Tracked Keywords</div>
              <div className="mt-2 flex gap-2">
                <input className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="Add keyword" value={newKw} onChange={(e)=>setNewKw(e.target.value)} />
                <Button size="sm" onClick={()=>{ if (newKw.trim()) { addKeyword(newKw.trim()); setNewKw(''); } }}>Add</Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(state.trackedKeywords||[]).map((kw)=> (
                  <Badge key={kw} variant="outline">{kw} <button className="ml-2" onClick={()=>removeKeyword(kw)}>×</button></Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Schedule</div>
              <select className="mt-2 h-9 rounded-md border bg-background px-3 text-sm" value={state.schedule} onChange={(e)=>setSchedule(e.target.value as any)}>
                <option value="off">Off</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Scheduling is simulated locally for the demo.</p>
            </div>
          </Card>
        )}

        {tab==='privacy' && (
          <Card className="p-6 space-y-6">
            <div>
              <div className="text-sm font-semibold">HIPAA Compliance Mode</div>
              <div className="mt-2 flex items-center gap-2">
                <input id="hipaa" type="checkbox" checked={state.hipaaMode} onChange={(e)=>setHipaaMode(e.target.checked)} />
                <label htmlFor="hipaa" className="text-sm">Process locally only</label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Summaries run on local Llama; no PHI sent externally.</p>
            </div>

            <div>
              <div className="text-sm font-semibold">Data Residency</div>
              <select className="mt-2 h-9 rounded-md border bg-background px-3 text-sm" value={state.dataResidency} onChange={(e)=>setResidency(e.target.value as any)}>
                <option value="local">Local</option>
                <option value="cloud">Cloud</option>
                <option value="encrypted">Encrypted</option>
              </select>
            </div>

            <div>
              <div className="text-sm font-semibold">Anonymization</div>
              <div className="mt-2 flex items-center gap-2">
                <input id="anon" type="checkbox" checked={state.anonymizePHI} onChange={(e)=>setAnonymizePHI(e.target.checked)} />
                <label htmlFor="anon" className="text-sm">Redact names/IDs in summaries</label>
              </div>
            </div>

            <Card className="p-4">
              <div className="text-sm font-semibold">Audit Log (last 50)</div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground max-h-60 overflow-auto">
                {audit.length === 0 ? (
                  <div>No events yet.</div>
                ) : (
                  audit.map((e, idx) => (
                    <div key={idx}>{new Date(e.ts).toLocaleString()} • {e.type}</div>
                  ))
                )}
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={exportData}>Export My Data</Button>
              <Button variant="destructive" onClick={deleteData}>Delete My Data</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Settings;
