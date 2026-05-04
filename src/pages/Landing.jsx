import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Code2,
  Users,
  Network,
  LineChart,
  ArrowRight,
  Mic,
  UserCircle2,
  FileDown,
  Sparkles,
} from "lucide-react";

const TYPES = [
  {
    id: "technical",
    label: "Technical",
    desc: "Coding, CS fundamentals, algorithms & language deep-dives.",
    icon: Code2,
  },
  {
    id: "behavioral",
    label: "Behavioral",
    desc: "STAR-method on teamwork, conflict, ownership.",
    icon: Users,
  },
  {
    id: "system_design",
    label: "System Design",
    desc: "Scalable systems, trade-offs, capacity & consistency.",
    icon: Network,
  },
  {
    id: "product_management",
    label: "Product",
    desc: "Prioritization, metrics, estimation & case studies.",
    icon: LineChart,
  },
];

export default function Landing() {
  const nav = useNavigate();
  const [selected, setSelected] = useState("technical");
  const [role, setRole] = useState("Software Engineer");
  const [num, setNum] = useState(5);

  const goToInterviewers = () => {
    const params = new URLSearchParams({
      type: selected,
      role: role || "Software Engineer",
      num: String(num),
    });
    nav(`/interviewers?${params.toString()}`);
  };

  return (
    <main data-testid="landing-page" className="relative z-10">
      {/* Hero */}
      <section className="px-6 md:px-12 lg:px-20 pt-16 md:pt-24 pb-12 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E2E0D8] bg-white mb-6">
              <Sparkles size={13} className="text-[#FF4500]" />
              <span className="text-xs font-mono tracking-widest uppercase text-[#6B6B6B]">
                AI Interview Simulator · 20 3D Personas
              </span>
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight text-[#121212]">
              Rehearse the <em className="not-italic text-[#FF4500]">hardest</em> question
              <br />
              before the recruiter asks it.
            </h1>
            <p className="mt-6 text-lg text-[#6B6B6B] max-w-xl leading-relaxed">
              Mockify spins up a realistic voice mock interview with a 3D AI
              interviewer of your choice, then returns a detailed coaching report
              in minutes.
            </p>
          </div>

          <div className="lg:col-span-4 text-sm text-[#6B6B6B] space-y-3 fade-up">
            {[
              { icon: UserCircle2, t: "20 generated 3D interviewers" },
              { icon: Mic, t: "Male & female voice personas" },
              { icon: FileDown, t: "Downloadable markdown report" },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white border border-[#E2E0D8] flex items-center justify-center">
                  <Icon size={14} />
                </div>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Card */}
      <section className="px-6 md:px-12 lg:px-20 pb-24 max-w-7xl mx-auto">
        <div
          data-testid="interview-setup"
          className="bg-white border border-[#E2E0D8] rounded-2xl p-8 md:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-heading text-2xl md:text-3xl font-medium tracking-tight">
              Pick a question type
            </h2>
            <span className="font-mono text-xs tracking-widest uppercase text-[#A1A1A1]">
              01 / Focus
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 stagger">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const active = selected === t.id;
              return (
                <button
                  key={t.id}
                  data-testid={`type-${t.id}-card`}
                  onClick={() => setSelected(t.id)}
                  className={`text-left p-5 rounded-xl border card-lift ${
                    active
                      ? "border-[#121212] bg-[#121212] text-white"
                      : "border-[#E2E0D8] bg-white hover:border-[#121212]"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={2}
                    className={active ? "text-[#FF4500]" : "text-[#121212]"}
                  />
                  <div className="mt-4 font-heading text-lg font-medium">{t.label}</div>
                  <p
                    className={`mt-2 text-xs leading-relaxed ${
                      active ? "text-white/70" : "text-[#6B6B6B]"
                    }`}
                  >
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-heading text-2xl md:text-3xl font-medium tracking-tight">
              Final touches
            </h2>
            <span className="font-mono text-xs tracking-widest uppercase text-[#A1A1A1]">
              02 / Details
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="md:col-span-2">
              <label className="font-mono text-xs tracking-widest uppercase text-[#A1A1A1] block mb-2">
                Target role
              </label>
              <input
                data-testid="role-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full bg-transparent border-b-2 border-[#E2E0D8] focus:border-[#121212] rounded-none px-0 py-3 outline-none transition-colors font-heading text-xl"
              />
            </div>
            <div>
              <label className="font-mono text-xs tracking-widest uppercase text-[#A1A1A1] block mb-2">
                # of questions
              </label>
              <div className="flex items-center gap-2">
                {[3, 5, 7].map((n) => (
                  <button
                    key={n}
                    data-testid={`num-${n}-button`}
                    onClick={() => setNum(n)}
                    className={`w-12 h-12 rounded-full border font-mono text-sm transition-all ${
                      num === n
                        ? "bg-[#121212] text-white border-[#121212]"
                        : "bg-white border-[#E2E0D8] hover:border-[#121212]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-[#E2E0D8] flex-wrap gap-4">
            <div className="text-sm text-[#6B6B6B]">
              Estimated duration:{" "}
              <span className="text-[#121212] font-medium">~{num * 3} minutes</span>
            </div>
            <button
              data-testid="continue-to-interviewers-button"
              onClick={goToInterviewers}
              className="group flex items-center gap-3 bg-[#FF4500] hover:bg-[#E03C00] text-white rounded-full px-6 py-3.5 font-medium btn-lift anim-glow-pulse shadow-[0_4px_20px_rgba(255,69,0,0.3)]"
            >
              Choose your interviewer
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
