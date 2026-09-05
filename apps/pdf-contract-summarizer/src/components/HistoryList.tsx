"use client";

interface Summary {
  id: string;
  filename: string;
  mode: string;
  outputText: string;
  createdAt: string;
}

interface HistoryListProps {
  summaries: Summary[];
}

export default function HistoryList({ summaries }: HistoryListProps) {
  if (summaries.length === 0) {
    return (
      <p className="text-center text-slate-500 py-12">
        No summaries yet. Upload a PDF to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {summaries.map((s) => (
        <div
          key={s.id}
          className="rounded-2xl border border-white/10 bg-slate-900/50 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">{s.mode === "contract" ? "📋" : "📄"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">
                {s.filename}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(s.createdAt).toLocaleString()} ·{" "}
                <span className="capitalize">{s.mode} summary</span>
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                s.mode === "contract"
                  ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                  : "border-teal-500/30 text-teal-400 bg-teal-500/10"
              }`}
            >
              {s.mode}
            </span>
          </div>

          <p className="text-sm text-slate-400 line-clamp-3">{s.outputText}</p>

          <details className="mt-2">
            <summary className="text-xs text-teal-400 hover:text-teal-300 cursor-pointer">
              Show full summary
            </summary>
            <div className="mt-3 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed border-t border-white/5 pt-3">
              {s.outputText}
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
