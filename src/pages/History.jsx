import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowUpRight, FileText } from "lucide-react";
import { listSessions } from "../lib/api";

const TYPE_LABELS = {
  technical: "Technical",
  behavioral: "Behavioral",
  system_design: "System Design",
  product_management: "Product Management",
};

export default function History() {
  const [sessions, setSessions] = useState(null);

  useEffect(() => {
    listSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  return (
    <main
      data-testid="history-page"
      className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto pb-20 pt-10"
    >
      <div className="mb-10">
        <div className="font-mono text-xs tracking-widest uppercase text-[#A1A1A1] mb-3">
          Archive
        </div>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
          Your past mocks<span className="text-[#FF4500]">.</span>
        </h1>
      </div>

      {sessions === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white border border-[#E2E0D8] rounded-2xl p-16 text-center">
          <FileText className="mx-auto mb-4 text-[#A1A1A1]" size={32} />
          <p className="font-heading text-xl mb-2">No mocks yet</p>
          <p className="text-[#6B6B6B] text-sm mb-6">
            Start your first session to see results here.
          </p>
          <Link
            to="/"
            data-testid="history-start-link"
            className="inline-flex items-center gap-2 bg-[#FF4500] text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-[#E03C00]"
          >
            Start a mock <ArrowUpRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <Link
              key={s.id}
              to={
                s.status === "completed"
                  ? `/feedback/${s.id}`
                  : `/interview/${s.id}`
              }
              data-testid={`history-card-${s.id}`}
              className="group bg-white border border-[#E2E0D8] rounded-2xl p-6 hover:-translate-y-1 hover:border-[#121212] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-mono text-xs tracking-widest uppercase text-[#A1A1A1]">
                  {TYPE_LABELS[s.interview_type] || s.interview_type}
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-[#A1A1A1] group-hover:text-[#FF4500] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <div className="font-heading text-xl font-medium mb-4 line-clamp-2">
                {s.role || "Interview"}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E0D8]">
                <span
                  className={`text-xs font-mono uppercase tracking-widest ${
                    s.status === "completed" ? "text-[#4A5D23]" : "text-[#6B6B6B]"
                  }`}
                >
                  {s.status === "completed" ? "Complete" : "In progress"}
                </span>
                {s.overall_score != null ? (
                  <span className="font-heading text-2xl font-bold text-[#FF4500]">
                    {s.overall_score}
                    <span className="text-sm text-[#A1A1A1] font-mono">/100</span>
                  </span>
                ) : (
                  <span className="text-xs text-[#A1A1A1]">
                    {s.num_questions} Qs
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
