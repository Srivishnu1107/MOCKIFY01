import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Volume2,
  User,
  User2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { AVATARS, speak, stopSpeaking } from "../lib/avatars";
import { startInterview } from "../lib/api";
import Tilt3DCard from "../components/Tilt3DCard";
import AnimatedPersona from "../components/AnimatedPersona";

const TYPE_LABELS = {
  technical: "Technical",
  behavioral: "Behavioral",
  system_design: "System Design",
  product_management: "Product",
};

export default function Interviewers() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const type = sp.get("type") || "technical";
  const role = sp.get("role") || "Software Engineer";
  const num = Number(sp.get("num") || 5);

  const [avatarId, setAvatarId] = useState(AVATARS[0].id);
  const [voiceFilter, setVoiceFilter] = useState("all"); // all | male | female
  const [bestFitOnly, setBestFitOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  const selected = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];

  const displayed = useMemo(() => {
    let list = AVATARS.slice();
    if (voiceFilter !== "all") {
      list = list.filter((a) => a.voice.gender === voiceFilter);
    }
    if (bestFitOnly) {
      list = list.filter((a) => a.specialty.includes(type));
    }
    return list;
  }, [voiceFilter, bestFitOnly, type]);

  const previewVoice = (a) => {
    stopSpeaking();
    speak(`Hello, I'm ${a.name}. ${a.tagline} Let's begin.`, a.voice);
  };

  const startMock = async () => {
    stopSpeaking();
    setLoading(true);
    try {
      const sess = await startInterview({
        interview_type: type,
        role,
        candidate_name: "Candidate",
        num_questions: num,
        avatar_id: avatarId,
      });
      toast.success(`Starting with ${selected.name}…`);
      nav(`/interview/${sess.id}`);
    } catch (e) {
      console.error(e);
      toast.error("Could not start interview. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const maleCount = AVATARS.filter((a) => a.voice.gender === "male").length;
  const femaleCount = AVATARS.filter((a) => a.voice.gender === "female").length;

  return (
    <main
      data-testid="interviewers-page"
      className="relative z-10 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto pb-32 pt-8"
    >
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4 anim-fade-in">
        <Link
          to="/"
          data-testid="back-to-setup-link"
          className="flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#121212] link-slide"
        >
          <ArrowLeft size={15} /> Back to setup
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#6B6B6B]">
          <span className="px-2.5 py-1 rounded-full border border-[#E2E0D8] bg-white">
            {TYPE_LABELS[type] || type}
          </span>
          <span className="px-2.5 py-1 rounded-full border border-[#E2E0D8] bg-white">
            {role}
          </span>
          <span className="px-2.5 py-1 rounded-full border border-[#E2E0D8] bg-white">
            {num} Q
          </span>
        </div>
      </div>

      {/* Hero header */}
      <div className="mb-10 anim-fade-in">
        <div className="flex items-center gap-2 mb-3 font-mono text-xs tracking-widest uppercase text-[#A1A1A1]">
          <Sparkles size={13} className="text-[#FF4500]" />
          02 / Meet your interviewer
        </div>
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#121212] leading-[1.05]">
          <span className="reveal-word reveal-word-delay-1"><span>Choose</span></span>{" "}
          <span className="reveal-word reveal-word-delay-2"><span>from</span></span>{" "}
          <span className="reveal-word reveal-word-delay-3"><span className="text-[#FF4500]">20</span></span>{" "}
          <span className="reveal-word reveal-word-delay-4"><span>3D AI personas.</span></span>
        </h1>
        <p className="mt-4 text-[#6B6B6B] max-w-2xl anim-fade-in" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
          Each persona is a procedurally generated 3D model with a distinct voice
          and interviewing style — {maleCount} male-voiced and {femaleCount} female-voiced.
          Hover any card to preview their voice.
        </p>
      </div>

      {/* Featured (selected) avatar */}
      <div className="anim-scale-in" style={{ animationDelay: "0.3s" }}>
        <FeaturedStage avatar={selected} onPreview={() => previewVoice(selected)} />
      </div>

      {/* Filters */}
      <div className="mt-10 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div
          data-testid="voice-filter"
          className="inline-flex items-center rounded-full bg-white border border-[#E2E0D8] p-1"
        >
          {[
            { id: "all", label: "All 20", icon: null },
            { id: "male", label: `Male · ${maleCount}`, icon: User },
            { id: "female", label: `Female · ${femaleCount}`, icon: User2 },
          ].map((opt) => {
            const active = voiceFilter === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                data-testid={`voice-filter-${opt.id}`}
                onClick={() => setVoiceFilter(opt.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-widest transition-colors ${
                  active
                    ? "bg-[#121212] text-white"
                    : "text-[#6B6B6B] hover:text-[#121212]"
                }`}
              >
                {Icon && <Icon size={11} />}
                {opt.label}
              </button>
            );
          })}
        </div>

        <button
          data-testid="best-fit-toggle"
          onClick={() => setBestFitOnly((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono uppercase tracking-widest transition-colors ${
            bestFitOnly
              ? "bg-[#FF4500] text-white border-[#FF4500]"
              : "bg-white text-[#6B6B6B] border-[#E2E0D8] hover:border-[#121212]"
          }`}
        >
          <Check size={12} />
          {bestFitOnly ? `Best fit for ${TYPE_LABELS[type]}` : "Show best fit only"}
        </button>
      </div>

      {/* Roster grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
        {displayed.map((a) => {
          const active = avatarId === a.id;
          const best = a.specialty.includes(type);
          return (
            <button
              key={a.id}
              data-testid={`avatar-${a.id}-card`}
              onClick={() => setAvatarId(a.id)}
              onDoubleClick={() => previewVoice(a)}
              onMouseEnter={() => previewVoice(a)}
              onMouseLeave={() => stopSpeaking()}
              className={`group relative text-left p-3 rounded-2xl border transition-all duration-200 ${
                active
                  ? "border-[#FF4500] bg-white shadow-[0_8px_28px_rgba(255,69,0,0.25)] -translate-y-1"
                  : "border-[#E2E0D8] bg-white hover:border-[#121212] hover:-translate-y-0.5"
              }`}
            >
              {active && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#FF4500] flex items-center justify-center z-10">
                  <Check size={13} className="text-white" strokeWidth={3} />
                </div>
              )}
              {best && !active && (
                <div className="absolute -top-1.5 left-3 font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 bg-[#121212] text-white rounded-full z-10">
                  Best fit
                </div>
              )}
              <Tilt3DCard intensity={10}>
                <div
                  className="tilt-inner relative w-full aspect-[4/5] rounded-xl overflow-hidden mb-3 flex items-end justify-center"
                  style={{
                    background: `linear-gradient(180deg, ${a.accent}1a 0%, ${a.accent}0d 55%, #f5f3ef 100%)`,
                  }}
                >
                  {/* Subtle grid backdrop */}
                  <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />
                  {/* Spotlight */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 50% 30%, ${a.accent}22 0%, transparent 60%)`,
                    }}
                  />
                  {/* Animated interviewer with micro facial movements */}
                  <div className="tilt-layer-front relative w-[95%] h-[95%] persona-sway">
                    <AnimatedPersona
                      avatar={a}
                      speaking={false}
                      imgClassName="drop-shadow-[0_10px_22px_rgba(0,0,0,0.18)]"
                    />
                  </div>
                  {/* Floor shadow */}
                  <div
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3/5 h-1.5 rounded-full blur-lg"
                    style={{ background: `${a.accent}66` }}
                  />
                  {/* Voice gender badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 backdrop-blur-md bg-white/80 border border-black/5 rounded-full px-2 py-0.5">
                    {a.voice.gender === "male" ? (
                      <User size={9} className="text-[#121212]" />
                    ) : (
                      <User2 size={9} className="text-[#121212]" />
                    )}
                    <span className="font-mono text-[8px] tracking-widest uppercase text-[#121212]">
                      {a.voice.gender === "male" ? "M" : "F"} · {a.voice.lang}
                    </span>
                  </div>
                  <div className="tilt-shine" />
                </div>
              </Tilt3DCard>
              <div className="font-heading text-sm font-medium leading-tight text-[#121212] truncate">
                {a.name}
              </div>
              <div className="font-mono text-[9px] tracking-widest uppercase text-[#6B6B6B] mt-1 line-clamp-1">
                {a.title}
              </div>
            </button>
          );
        })}
      </div>
      {displayed.length === 0 && (
        <div className="text-center text-sm text-[#6B6B6B] mb-12 py-10 bg-white border border-[#E2E0D8] rounded-2xl">
          No personas match your filter. Try another combination.
        </div>
      )}

      {/* Sticky footer CTA */}
      <div
        data-testid="start-bar"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 backdrop-blur-xl bg-white/85 border border-[#E2E0D8] rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.08)] pl-4 pr-2 py-2 flex items-center gap-4 max-w-[calc(100vw-2rem)] anim-scale-in"
        style={{ animationDelay: "0.8s" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0"
            style={{
              background: `linear-gradient(180deg, ${selected.accent}44, #050505)`,
            }}
          >
            <img
              src={selected.image}
              alt={selected.name}
              className="w-[95%] h-[95%] object-contain persona-animate"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-mono tracking-widest uppercase text-[#A1A1A1]">
              Selected
            </div>
            <div className="font-heading text-sm font-medium text-[#121212] truncate">
              {selected.name} ·{" "}
              <span className="text-[#6B6B6B]">
                {selected.voice.gender === "male" ? "♂" : "♀"} {selected.voice.lang}
              </span>
            </div>
          </div>
        </div>
        <button
          data-testid="start-interview-button"
          onClick={startMock}
          disabled={loading}
          className="flex items-center gap-2 bg-[#FF4500] hover:bg-[#E03C00] disabled:opacity-60 text-white rounded-full px-5 py-2.5 text-sm font-medium btn-lift anim-glow-pulse shrink-0"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Preparing…
            </>
          ) : (
            <>
              Start with {selected.name}
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </main>
  );
}

function FeaturedStage({ avatar, onPreview }) {
  return (
    <div
      data-testid="featured-avatar"
      className="relative rounded-3xl overflow-hidden border border-[#E2E0D8]"
      style={{
        background: `linear-gradient(135deg, ${avatar.accent} 0%, #050505 80%)`,
      }}
    >
      <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square rounded-full border border-white/20 orbit-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] aspect-square rounded-full border border-white/15 orbit-fast" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full border border-white/10" />
      </div>

      <div className="relative grid md:grid-cols-5 gap-6 p-8 md:p-12 items-center">
        <div className="md:col-span-2 flex justify-center">
          <Tilt3DCard intensity={18}>
            <div className="tilt-inner relative w-64 h-80 md:w-80 md:h-96">
              <div
                className="tilt-layer-front relative w-full h-full rounded-2xl overflow-hidden border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.45)] flex items-end justify-center"
                style={{
                  background: `linear-gradient(180deg, ${avatar.accent}66 0%, ${avatar.accent}22 45%, #0f0f0f 100%)`,
                }}
              >
                {/* Subtle studio grid */}
                <div
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
                {/* Orbital rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] aspect-square rounded-full border border-white/15 orbit-slow pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] aspect-square rounded-full border border-white/8 pointer-events-none" />
                {/* Top spotlight */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 10%, rgba(255,255,255,0.28) 0%, transparent 55%)",
                  }}
                />
                {/* Animated 3D interviewer */}
                <div className="relative w-[98%] h-[98%] persona-sway">
                  <AnimatedPersona
                    avatar={avatar}
                    speaking={false}
                    imgClassName="drop-shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
                  />
                </div>
                <div className="tilt-shine" />
              </div>
              {/* Floor reflection glow */}
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-6 rounded-full blur-2xl"
                style={{ background: "rgba(255,69,0,0.45)" }}
              />
            </div>
          </Tilt3DCard>
        </div>

        <div className="md:col-span-3 text-white">
          <div className="font-mono text-[10px] tracking-widest uppercase text-white/50 mb-2 flex items-center gap-2">
            Selected persona
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/30">
              {avatar.voice.gender === "male" ? (
                <User size={10} />
              ) : (
                <User2 size={10} />
              )}
              {avatar.voice.gender === "male" ? "Male voice" : "Female voice"} ·{" "}
              {avatar.voice.lang}
            </span>
          </div>
          <h3 className="font-heading text-3xl md:text-5xl font-medium leading-tight">
            {avatar.name}
          </h3>
          <div className="mt-2 font-mono text-xs tracking-widest uppercase text-white/60">
            {avatar.title}
          </div>
          <p className="mt-5 text-white/80 text-lg leading-relaxed max-w-lg">
            "{avatar.tagline}"
          </p>
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <button
              data-testid="featured-preview-voice"
              onClick={onPreview}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/30 text-white hover:bg-white/10 transition-colors text-sm"
            >
              <Volume2 size={14} />
              Preview voice
            </button>
            {avatar.specialty.map((s) => (
              <span
                key={s}
                className="font-mono text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-white/30 text-white/80"
              >
                {TYPE_LABELS[s] || s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
