"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DEFAULT_PROMPT = "Flight between Vienna and Paris at FL350\nFlight between Singapore and Marseille at FL360";
const FlightMap = dynamic(() => import("../components/FlightMap"), { ssr: false });

export default function Home() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [tpl, setTpl] = useState<string | null>(null);
  const [plans, setPlans] = useState<Array<Record<string, string>> | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(value: string = prompt) {
    setLoading(true);
    setError(null);
    setTpl(null);
    try {
      const res = await fetch("/api/generate-tpl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value.trim() || DEFAULT_PROMPT }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Server error");
      }
      const data = await res.json();
      setTpl(data.tpl);
      setPlans(data.plans || (data.plan ? [data.plan] : null));
      setFilename(data.filename || "plan.tpl");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void generate(DEFAULT_PROMPT);
  }, []);

  function downloadTpl() {
    if (!tpl) return;
    const blob = new Blob([tpl], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "plan.tpl";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-8">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 p-8 rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">ATM TPL Generator (MVP)</h1>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Flight from Paris to Singapore at FL350"
          className="w-full h-28 p-3 border rounded mb-3 bg-white dark:bg-zinc-800"
        />
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => generate()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {loading ? "Génération..." : "Générer TPL"}
          </button>
          <button
            onClick={downloadTpl}
            disabled={!tpl}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
          >
            Télécharger
          </button>
        </div>

        {error && <div className="text-red-600 mb-2">Erreur: {error}</div>}

        {tpl ? (
          <div>
            <h2 className="font-medium mb-2">Aperçu TPL</h2>
            <pre className="bg-black text-white p-3 rounded overflow-auto">{tpl}</pre>
            {plans?.length ? (
              <div className="mt-6">
                <h2 className="font-medium mb-2">Plans dans ce TPL</h2>
                <div className="space-y-2 mb-4">
                  {plans.map((planItem) => (
                    <div key={planItem.callsign} className="rounded border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-950">
                      <strong>{planItem.callsign}</strong>: {planItem.departure} → {planItem.destination}
                    </div>
                  ))}
                </div>
                <h2 className="font-medium mb-2">Vue des vols</h2>
                <FlightMap plans={plans} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-zinc-500">Aucun TPL généré.</div>
        )}
      </div>
    </div>
  );
}
