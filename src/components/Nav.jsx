import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Home,
  Users,
  History as HistoryIcon,
  User,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", to: "/", icon: Home, match: (p) => p === "/" },
  {
    id: "interviewers",
    label: "Interviewers",
    to: "/interviewers",
    icon: Users,
    match: (p) => p.startsWith("/interviewers"),
  },
  {
    id: "history",
    label: "History",
    to: "/history",
    icon: HistoryIcon,
    match: (p) => p.startsWith("/history") || p.startsWith("/feedback"),
  },
  {
    id: "profile",
    label: "Profile",
    to: "/profile",
    icon: User,
    match: (p) => p.startsWith("/profile"),
  },
];

export default function Nav() {
  const loc = useLocation();
  const nav = useNavigate();
  const isInterview = loc.pathname.startsWith("/interview/");

  const [pill, setPill] = useState({ left: 0, width: 0, opacity: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);
  const linksRef = useRef([]);
  const containerRef = useRef(null);

  const recalcPill = () => {
    const idx = NAV_ITEMS.findIndex((it) => it.match(loc.pathname));
    if (idx === -1 || !linksRef.current[idx] || !containerRef.current) {
      setPill((p) => ({ ...p, opacity: 0 }));
      return;
    }
    const el = linksRef.current[idx];
    const c = containerRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPill({ left: r.left - c.left, width: r.width, opacity: 1 });
  };

  useEffect(() => {
    recalcPill();
    const onResize = () => recalcPill();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);

  const onLinkHover = (i) => {
    if (!linksRef.current[i] || !containerRef.current) return;
    const el = linksRef.current[i];
    const c = containerRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPill({ left: r.left - c.left, width: r.width, opacity: 1 });
  };
  const onLinkLeave = () => recalcPill();

  if (isInterview) {
    return (
      <header
        data-testid="top-nav"
        className="relative z-30 flex items-center justify-between px-6 md:px-12 py-5"
      >
        <Logo />
      </header>
    );
  }

  return (
    <>
      <header
        data-testid="top-nav"
        className="sticky top-0 z-30 px-4 md:px-12 pt-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Logo />

          {/* Center pill nav (desktop) */}
          <div
            ref={containerRef}
            onMouseLeave={onLinkLeave}
            className="hidden md:flex relative items-center gap-1 px-2 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-[#E2E0D8] shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          >
            <div
              data-testid="nav-pill"
              className="absolute top-2 bottom-2 rounded-full bg-[#121212] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
              style={{
                left: pill.left,
                width: pill.width,
                opacity: pill.opacity,
              }}
            />
            {NAV_ITEMS.map((it, i) => {
              const active = it.match(loc.pathname);
              const Icon = it.icon;
              return (
                <Link
                  key={it.id}
                  ref={(el) => (linksRef.current[i] = el)}
                  to={it.to}
                  data-testid={`nav-${it.id}-link`}
                  onMouseEnter={() => onLinkHover(i)}
                  className={`relative z-[1] flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                    active ? "text-white" : "text-[#6B6B6B] hover:text-[#121212]"
                  }`}
                >
                  <Icon size={14} />
                  {it.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              data-testid="nav-start-session-button"
              onClick={() => nav("/")}
              className="hidden sm:flex group relative items-center gap-2 bg-[#121212] hover:bg-[#FF4500] text-white rounded-full pl-5 pr-2 py-2 text-sm font-medium btn-lift overflow-hidden"
            >
              <span className="relative z-10">Start session</span>
              <span className="relative z-10 w-7 h-7 rounded-full bg-[#FF4500] group-hover:bg-white flex items-center justify-center transition-colors duration-300">
                <ArrowRight
                  size={13}
                  strokeWidth={2.5}
                  className="text-white group-hover:text-[#121212] group-hover:translate-x-0.5 transition-all"
                />
              </span>
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
                }}
              />
            </button>

            <button
              data-testid="nav-mobile-toggle"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-10 h-10 rounded-full bg-white border border-[#E2E0D8] flex items-center justify-center"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          data-testid="mobile-nav-sheet"
          className="fixed inset-x-0 top-[72px] z-30 md:hidden bg-white/95 backdrop-blur-xl border-b border-[#E2E0D8] shadow-[0_20px_40px_rgba(0,0,0,0.08)] anim-fade-in"
        >
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-2">
            {NAV_ITEMS.map((it) => {
              const active = it.match(loc.pathname);
              const Icon = it.icon;
              return (
                <Link
                  key={it.id}
                  to={it.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#121212] text-white"
                      : "text-[#121212] hover:bg-[#F0EFEA]"
                  }`}
                >
                  <Icon size={16} />
                  {it.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileOpen(false);
                nav("/");
              }}
              className="mt-2 flex items-center justify-between gap-3 bg-[#FF4500] text-white rounded-xl px-5 py-4 text-sm font-medium"
            >
              Start session
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Logo() {
  return (
    <Link
      to="/"
      data-testid="nav-logo"
      className="group flex items-center gap-2.5 select-none"
    >
      <div className="relative w-9 h-9 rounded-xl bg-[#121212] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 rounded-xl bg-[#FF4500] opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500" />
        <Sparkles
          size={16}
          className="relative text-[#FF4500] group-hover:text-white transition-colors duration-300 group-hover:rotate-180 transform-gpu duration-500"
          strokeWidth={2.5}
        />
        <span
          className="absolute w-1 h-1 rounded-full bg-[#FF4500] orbit-fast"
          style={{ top: "10%", left: "50%", transform: "translateX(-50%)" }}
        />
      </div>
      <span className="font-heading text-xl tracking-tight font-bold text-[#121212] flex items-baseline">
        mockify
        <span className="text-[#FF4500] inline-block group-hover:scale-150 group-hover:translate-y-[-2px] transition-transform duration-300 origin-bottom">
          .
        </span>
      </span>
    </Link>
  );
}
