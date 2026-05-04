import { useEffect, useState, useRef } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

const THOUGHTS = [
  {
    text: "The best interviewers don't ask harder questions — they listen better.",
    author: "Mockify",
  },
  {
    text: "Confidence is preparation made visible.",
    author: "On rehearsal",
  },
  {
    text: "An interview is a conversation, not a courtroom.",
    author: "On mindset",
  },
  {
    text: "Practice doesn't make perfect — it makes permanent.",
    author: "On reps",
  },
  {
    text: "You're not auditioning. You're collaborating.",
    author: "On framing",
  },
];

const LOAD_MS = 5000;

/**
 * IntroScreen — premium splash with two phases:
 *   1. "ready"   → wordmark + slogan + Enter button
 *   2. "loading" → 5-second branded loader with rotating thoughts
 *   3. fade out  → reveals the app
 */
export default function IntroScreen({ onDone }) {
  const [phase, setPhase] = useState("ready"); // ready | loading | leaving
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const cycleRef = useRef(null);
  const finishRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "Enter" || e.key === " ") && phase === "ready") {
        startLoading();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
      if (finishRef.current) clearTimeout(finishRef.current);
    };
  }, []);

  const startLoading = () => {
    if (phase !== "ready") return;
    setPhase("loading");
    setThoughtIdx(Math.floor(Math.random() * THOUGHTS.length));
    // Rotate thoughts every ~1.7s
    cycleRef.current = setInterval(() => {
      setThoughtIdx((i) => (i + 1) % THOUGHTS.length);
    }, 1700);
    finishRef.current = setTimeout(() => {
      if (cycleRef.current) clearInterval(cycleRef.current);
      setPhase("leaving");
      setTimeout(() => onDone?.(), 500);
    }, LOAD_MS);
  };

  const leaving = phase === "leaving";

  return (
    <div
      data-testid="intro-screen"
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #1a1410 0%, #0a0807 60%, #050403 100%)",
      }}
    >
      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Architectural grid */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at 50% 50%, #000 30%, transparent 75%)",
        }}
      />

      {/* Orbital rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vmin] aspect-square rounded-full border border-white/8 orbit-slow pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vmin] aspect-square rounded-full border border-white/12 orbit-fast pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35vmin] aspect-square rounded-full border border-[#FF4500]/25 ring-pulse pointer-events-none" />

      {/* Accent glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vmin] aspect-square rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,69,0,0.18) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* Content */}
      <div className="relative text-center px-6 max-w-2xl">
        {/* Pre-mark */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5 backdrop-blur-md mb-8 anim-fade-in"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          <Sparkles size={12} className="text-[#FF4500]" />
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/70">
            AI Interview Simulator
          </span>
        </div>

        {/* Wordmark */}
        <div className="font-heading text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight text-white leading-none">
          <span className="reveal-word reveal-word-delay-1">
            <span>mock</span>
          </span>
          <span className="reveal-word reveal-word-delay-2">
            <span>ify</span>
          </span>
          <span className="reveal-word reveal-word-delay-3">
            <span className="text-[#FF4500]">.</span>
          </span>
        </div>

        {/* Phase: ready */}
        {phase === "ready" && (
          <>
            <p
              className="mt-8 text-white/60 text-lg sm:text-xl font-body italic leading-relaxed max-w-xl mx-auto anim-fade-in"
              style={{ animationDelay: "0.7s", animationFillMode: "both" }}
            >
              Rehearse with intention.
              <br className="hidden sm:block" />
              <span className="text-white/85"> Walk in, certain.</span>
            </p>
            <div
              className="mt-12 flex flex-col items-center gap-4 anim-fade-in"
              style={{ animationDelay: "1.2s", animationFillMode: "both" }}
            >
              <button
                data-testid="enter-mockify-button"
                onClick={startLoading}
                className="group flex items-center gap-3 bg-[#FF4500] hover:bg-[#E03C00] text-white rounded-full px-8 py-4 font-medium text-base btn-lift anim-glow-pulse shadow-[0_8px_30px_rgba(255,69,0,0.4)]"
              >
                Enter Mockify
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35">
                press enter to continue
              </span>
            </div>
          </>
        )}

        {/* Phase: loading (5s) */}
        {phase !== "ready" && (
          <div className="mt-10 anim-fade-in" key="loading">
            {/* Rotating thought */}
            <div
              key={thoughtIdx}
              data-testid="loading-thought"
              className="min-h-[120px] sm:min-h-[100px] flex flex-col items-center justify-center anim-fade-in"
            >
              <p className="text-white/85 text-xl sm:text-2xl font-body italic leading-snug max-w-xl mx-auto">
                "{THOUGHTS[thoughtIdx].text}"
              </p>
              <span className="mt-3 font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">
                — {THOUGHTS[thoughtIdx].author}
              </span>
            </div>

            {/* Loader */}
            <div className="mt-10 flex items-center justify-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40">
                Preparing studio
              </span>
              <div className="relative w-40 h-[2px] bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#FF4500] rounded-full intro-bar"
                  style={{ animationDuration: `${LOAD_MS}ms` }}
                />
              </div>
              <Loader2 size={12} className="text-[#FF4500] animate-spin" />
            </div>

            <div className="mt-4 font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">
              Calibrating voice models · loading interviewer roster
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
