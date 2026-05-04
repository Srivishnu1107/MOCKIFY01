import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Download,
  Award,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Loader2,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { getSession } from "../lib/api";
import { toast } from "sonner";

const TYPE_LABELS = {
  technical: "Technical",
  behavioral: "Behavioral",
  system_design: "System Design",
  product_management: "Product Management",
};

function ScoreRing({ value, label, size = 140 }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E0D8" strokeWidth="6" fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#FF4500"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-heading text-4xl font-bold">{pct}</div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-[#A1A1A1] mt-1">
            / 100
          </div>
        </div>
      </div>
      <div className="font-mono text-xs tracking-widest uppercase text-[#6B6B6B] mt-3">
        {label}
      </div>
    </div>
  );
}

export default function Feedback() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);

  useEffect(() => {
    getSession(sessionId)
      .then(setSession)
      .catch(() => toast.error("Could not load feedback"));
  }, [sessionId]);

  const downloadMarkdown = () => {
    if (!session || !session.feedback) return;
    const f = session.feedback;
    const created = new Date(session.created_at).toLocaleString();
    let md = `# Mockify Interview Report\n\n`;
    md += `**Candidate:** ${session.candidate_name}  \n`;
    md += `**Role:** ${session.role}  \n`;
    md += `**Interview Type:** ${TYPE_LABELS[session.interview_type] || session.interview_type}  \n`;
    md += `**Date:** ${created}  \n\n`;
    md += `---\n\n## Scores\n\n`;
    md += `| Metric | Score |\n|---|---|\n`;
    md += `| **Overall** | ${f.overall_score}/100 |\n`;
    md += `| Communication | ${f.communication_score}/100 |\n`;
    md += `| Content | ${f.content_score}/100 |\n`;
    md += `| Confidence | ${f.confidence_score}/100 |\n\n`;
    md += `## Summary\n\n${f.summary}\n\n`;
    md += `## Strengths\n\n${(f.strengths || []).map((s) => `- ${s}`).join("\n")}\n\n`;
    md += `## Areas for Improvement\n\n${(f.weaknesses || []).map((s) => `- ${s}`).join("\n")}\n\n`;
    md += `## Suggestions\n\n${(f.improvement_suggestions || []).map((s) => `- ${s}`).join("\n")}\n\n`;
    md += `## Per-Question Feedback\n\n`;
    (f.per_question_feedback || []).forEach((q, i) => {
      md += `### Q${i + 1}. ${q.question}\n\n`;
      md += `**Your answer:** ${q.answer || "(no answer)"}\n\n`;
      md += `**Feedback:** ${q.feedback}\n\n`;
      md += `**Score:** ${q.score}/10\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mockify-report-${sessionId.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const f = session.feedback || {};

  return (
    <main
      data-testid="feedback-page"
      className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto pb-20 pt-8 anim-fade-in"
    >
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/history"
          className="flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#121212]"
        >
          <ArrowLeft size={16} /> All sessions
        </Link>
        <button
          data-testid="download-feedback-button"
          onClick={downloadMarkdown}
          className="flex items-center gap-2 bg-[#121212] text-white hover:bg-[#FF4500] rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <Download size={16} />
          Download report (.md)
        </button>
      </div>

      <div className="mb-10 fade-up">
        <div className="font-mono text-xs tracking-widest uppercase text-[#A1A1A1] mb-3">
          Mock Interview Report
        </div>
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#121212] leading-[1.05]">
          {TYPE_LABELS[session.interview_type] || session.interview_type}
          <span className="text-[#FF4500]">.</span>{" "}
          <span className="text-[#6B6B6B] font-medium">{session.role}</span>
        </h1>
      </div>

      {/* Bento grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-6 stagger">
        <div className="md:col-span-2 bg-white border border-[#E2E0D8] rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
          <ScoreRing value={f.overall_score || 0} label="Overall" size={160} />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-[#FF4500]" />
              <span className="font-mono text-xs tracking-widest uppercase text-[#6B6B6B]">
                Executive summary
              </span>
            </div>
            <p className="text-[#121212] leading-relaxed">
              {f.summary || "No summary available."}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E2E0D8] rounded-2xl p-6 flex flex-col items-center justify-center">
          <ScoreRing value={f.communication_score || 0} label="Communication" size={120} />
        </div>
        <div className="bg-white border border-[#E2E0D8] rounded-2xl p-6 flex flex-col items-center justify-center">
          <ScoreRing value={f.content_score || 0} label="Content" size={120} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6 stagger">
        <BentoList
          testid="strengths-card"
          icon={TrendingUp}
          label="Strengths"
          tone="success"
          items={f.strengths}
        />
        <BentoList
          testid="weaknesses-card"
          icon={TrendingDown}
          label="Areas to improve"
          tone="warn"
          items={f.weaknesses}
        />
        <BentoList
          testid="suggestions-card"
          icon={Lightbulb}
          label="Suggestions"
          tone="accent"
          items={f.improvement_suggestions}
        />
      </div>

      {/* Per question */}
      <div
        data-testid="per-question-section"
        className="bg-white border border-[#E2E0D8] rounded-2xl p-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare size={16} />
          <h2 className="font-heading text-2xl font-medium">Question-by-question</h2>
        </div>
        <div className="space-y-8">
          {(f.per_question_feedback || []).map((q, i) => (
            <div key={i} className="border-t border-[#E2E0D8] pt-6 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="font-heading text-lg font-medium flex-1">
                  <span className="text-[#A1A1A1] font-mono mr-2">Q{i + 1}.</span>
                  {q.question}
                </h3>
                <div className="text-right shrink-0">
                  <div className="font-heading text-3xl font-bold text-[#FF4500]">
                    {q.score}
                  </div>
                  <div className="font-mono text-[10px] tracking-widest uppercase text-[#A1A1A1]">
                    / 10
                  </div>
                </div>
              </div>
              <div className="text-sm text-[#6B6B6B] mb-3 italic">
                "{q.answer || "(no answer)"}"
              </div>
              <div className="text-sm text-[#121212] leading-relaxed">{q.feedback}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function BentoList({ testid, icon: Icon, label, items, tone }) {
  const toneColor =
    tone === "success"
      ? "text-[#4A5D23]"
      : tone === "warn"
      ? "text-[#FF4500]"
      : "text-[#121212]";
  return (
    <div
      data-testid={testid}
      className="bg-white border border-[#E2E0D8] rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className={toneColor} />
        <span className="font-mono text-xs tracking-widest uppercase text-[#6B6B6B]">
          {label}
        </span>
      </div>
      <ul className="space-y-3">
        {(items || []).map((it, i) => (
          <li key={i} className="text-sm text-[#121212] leading-relaxed flex gap-2">
            <span className={`font-mono ${toneColor} shrink-0`}>›</span>
            <span>{it}</span>
          </li>
        ))}
        {!items?.length && <li className="text-sm text-[#A1A1A1]">No items.</li>}
      </ul>
    </div>
  );
}
