import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Camera,
  Edit3,
  Save,
  X,
  MapPin,
  Briefcase,
  Award,
  TrendingUp,
  Calendar,
  ExternalLink,
  Github,
  Linkedin,
  Globe,
  Plus,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { loadProfile, saveProfile, fileToDataUrl } from "../lib/profile";
import { listSessions } from "../lib/api";

const TYPE_LABELS = {
  technical: "Technical",
  behavioral: "Behavioral",
  system_design: "System Design",
  product_management: "Product",
};

export default function Profile() {
  const [profile, setProfile] = useState(loadProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const fileRef = useRef(null);
  const bannerRef = useRef(null);

  useEffect(() => {
    listSessions()
      .then((s) => setSessions(s || []))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }, []);

  const stats = useMemo(() => {
    const completed = sessions.filter((s) => s.status === "completed");
    const total = sessions.length;
    const scores = completed
      .map((s) => s.overall_score)
      .filter((v) => typeof v === "number");
    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const best = scores.length ? Math.max(...scores) : 0;
    const byType = {};
    completed.forEach((s) => {
      byType[s.interview_type] = (byType[s.interview_type] || 0) + 1;
    });
    return { total, completed: completed.length, avg, best, byType };
  }, [sessions]);

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };
  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };
  const commitEdit = () => {
    setProfile(draft);
    saveProfile(draft);
    setEditing(false);
    toast.success("Profile updated");
  };

  const handlePictureUpload = async (e, kind = "picture") => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const next = { ...(editing ? draft : profile), [kind]: dataUrl };
      if (editing) {
        setDraft(next);
      } else {
        setProfile(next);
        saveProfile(next);
      }
      toast.success(kind === "banner" ? "Cover updated" : "Picture updated");
    } catch (err) {
      toast.error(err.message || "Upload failed");
    }
  };

  const value = editing ? draft : profile;
  const updateDraft = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <main
      data-testid="profile-page"
      className="relative z-10 px-4 md:px-12 max-w-5xl mx-auto pb-32 pt-6 anim-fade-in"
    >
      {/* Cover + Avatar card */}
      <div
        data-testid="profile-card"
        className="bg-white border border-[#E2E0D8] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
      >
        {/* Cover banner */}
        <div
          className="relative h-44 md:h-56"
          style={{
            background: value.banner
              ? `url(${value.banner}) center/cover no-repeat`
              : "linear-gradient(135deg, #1e3a5f 0%, #5e2a75 50%, #FF4500 110%)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          <button
            onClick={() => bannerRef.current?.click()}
            data-testid="upload-banner-button"
            className="absolute top-4 right-4 flex items-center gap-2 backdrop-blur-md bg-black/30 hover:bg-black/50 border border-white/20 rounded-full px-3 py-1.5 text-white text-xs font-mono uppercase tracking-widest transition-colors"
          >
            <Camera size={12} />
            Cover
          </button>
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            onChange={(e) => handlePictureUpload(e, "banner")}
            className="hidden"
          />
        </div>

        {/* Avatar + name row (stacked LinkedIn-style) */}
        <div className="px-6 md:px-10 pb-6">
          {/* Avatar overlapping cover */}
          <div className="relative -mt-16 mb-4 flex items-end justify-between flex-wrap gap-3">
            <div className="relative">
              <div
                data-testid="profile-picture"
                className="w-32 h-32 md:w-36 md:h-36 rounded-2xl border-4 border-white bg-[#F0EFEA] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
                style={{
                  background: value.picture
                    ? `url(${value.picture}) center/cover no-repeat`
                    : `linear-gradient(135deg, #1e3a5f, #FF4500)`,
                }}
              >
                {!value.picture && (
                  <div className="w-full h-full flex items-center justify-center font-heading text-4xl font-bold text-white">
                    {(value.name || "?").trim().slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                data-testid="upload-picture-button"
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#121212] hover:bg-[#FF4500] text-white flex items-center justify-center transition-colors shadow-lg"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => handlePictureUpload(e, "picture")}
                className="hidden"
              />
            </div>

            {/* Edit / Save buttons */}
            <div className="flex items-center gap-2">
              {!editing ? (
                <button
                  data-testid="edit-profile-button"
                  onClick={startEdit}
                  className="flex items-center gap-2 bg-white border border-[#E2E0D8] hover:border-[#121212] rounded-full px-4 py-2 text-sm font-medium btn-lift"
                >
                  <Edit3 size={14} /> Edit profile
                </button>
              ) : (
                <>
                  <button
                    data-testid="cancel-edit-button"
                    onClick={cancelEdit}
                    className="flex items-center gap-2 bg-white border border-[#E2E0D8] hover:border-[#121212] rounded-full px-4 py-2 text-sm font-medium btn-lift"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    data-testid="save-profile-button"
                    onClick={commitEdit}
                    className="flex items-center gap-2 bg-[#FF4500] hover:bg-[#E03C00] text-white rounded-full px-5 py-2 text-sm font-medium btn-lift"
                  >
                    <Save size={14} /> Save
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name + headline (below avatar) */}
          <div>
            {editing ? (
              <input
                data-testid="edit-name"
                value={draft.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
                className="font-heading text-3xl md:text-4xl font-bold tracking-tight bg-transparent border-b-2 border-[#E2E0D8] focus:border-[#121212] outline-none w-full max-w-md py-1"
              />
            ) : (
              <h1
                data-testid="profile-name"
                className="font-heading text-3xl md:text-4xl font-bold tracking-tight"
              >
                {value.name}
              </h1>
            )}
            {editing ? (
              <input
                data-testid="edit-headline"
                value={draft.headline}
                onChange={(e) => updateDraft({ headline: e.target.value })}
                placeholder="Senior Engineer at..."
                className="mt-2 text-[#6B6B6B] bg-transparent border-b border-[#E2E0D8] focus:border-[#121212] outline-none w-full max-w-md py-1"
              />
            ) : (
              <p className="mt-2 text-[#6B6B6B] text-base md:text-lg">{value.headline}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs font-mono tracking-widest uppercase text-[#A1A1A1] flex-wrap">
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} />
                {editing ? (
                  <input
                    value={draft.location}
                    onChange={(e) => updateDraft({ location: e.target.value })}
                    className="bg-transparent border-b border-[#E2E0D8] focus:border-[#121212] outline-none uppercase text-[10px] tracking-widest w-32"
                  />
                ) : (
                  value.location
                )}
              </span>
              <span className="inline-flex items-center gap-1">
                <Briefcase size={11} />
                {stats.completed} mocks completed
              </span>
              {stats.avg > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Award size={11} />
                  {stats.avg}/100 avg score
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6 pt-6 border-t border-[#E2E0D8]">
            {editing ? (
              <textarea
                data-testid="edit-bio"
                value={draft.bio}
                onChange={(e) => updateDraft({ bio: e.target.value })}
                rows={3}
                placeholder="Add a short bio..."
                className="w-full bg-transparent border border-[#E2E0D8] focus:border-[#121212] outline-none rounded-lg p-3 text-sm leading-relaxed resize-none"
              />
            ) : (
              <p className="text-[#121212] leading-relaxed">{value.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance dashboard */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-2xl font-medium">Performance</h2>
          <span className="font-mono text-xs tracking-widest uppercase text-[#A1A1A1]">
            All-time stats
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
          <StatCard
            icon={Briefcase}
            label="Total mocks"
            value={stats.total}
            tone="default"
          />
          <StatCard
            icon={Award}
            label="Completed"
            value={stats.completed}
            tone="success"
          />
          <StatCard
            icon={TrendingUp}
            label="Average"
            value={stats.avg ? `${stats.avg}` : "—"}
            unit="/100"
            tone="accent"
          />
          <StatCard
            icon={Sparkles}
            label="Best score"
            value={stats.best ? `${stats.best}` : "—"}
            unit="/100"
            tone="accent"
          />
        </div>

        {/* By interview type */}
        {stats.completed > 0 && (
          <div className="mt-6 bg-white border border-[#E2E0D8] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-lg font-medium">Mocks by track</h3>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#A1A1A1]">
                Distribution
              </span>
            </div>
            <div className="space-y-4">
              {Object.entries(TYPE_LABELS).map(([id, label]) => {
                const count = stats.byType[id] || 0;
                const pct = stats.completed
                  ? Math.round((count / stats.completed) * 100)
                  : 0;
                return (
                  <div key={id}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="font-mono text-xs text-[#6B6B6B]">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#F0EFEA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF4500] transition-all duration-1000"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-2xl font-medium">Recent activity</h2>
          <Link
            to="/history"
            className="text-sm text-[#6B6B6B] hover:text-[#121212] flex items-center gap-1 link-slide"
          >
            View all <ArrowUpRight size={13} />
          </Link>
        </div>
        {loadingSessions ? (
          <div className="bg-white border border-[#E2E0D8] rounded-2xl p-10 text-center text-sm text-[#A1A1A1]">
            Loading your activity…
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white border border-[#E2E0D8] rounded-2xl p-10 text-center">
            <Calendar className="mx-auto mb-3 text-[#A1A1A1]" size={28} />
            <p className="font-heading text-lg mb-1">Nothing here yet</p>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Start your first mock interview to populate your profile.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#FF4500] text-white rounded-full px-5 py-2.5 text-sm font-medium btn-lift"
            >
              Start a mock <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                to={
                  s.status === "completed"
                    ? `/feedback/${s.id}`
                    : `/interview/${s.id}`
                }
                className="block bg-white border border-[#E2E0D8] rounded-xl px-5 py-4 hover:border-[#121212] hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#F0EFEA] flex items-center justify-center shrink-0">
                      <Briefcase size={14} className="text-[#121212]" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-heading text-base font-medium truncate">
                        {s.role || "Mock interview"}
                      </div>
                      <div className="font-mono text-[10px] tracking-widest uppercase text-[#A1A1A1] mt-0.5">
                        {TYPE_LABELS[s.interview_type] || s.interview_type} ·{" "}
                        {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.overall_score != null ? (
                      <div className="text-right">
                        <div className="font-heading text-2xl font-bold text-[#FF4500] leading-none">
                          {s.overall_score}
                        </div>
                        <div className="font-mono text-[9px] tracking-widest uppercase text-[#A1A1A1]">
                          /100
                        </div>
                      </div>
                    ) : (
                      <span
                        className={`font-mono text-[10px] tracking-widest uppercase ${
                          s.status === "completed" ? "text-[#4A5D23]" : "text-[#6B6B6B]"
                        }`}
                      >
                        {s.status === "completed" ? "Done" : "In progress"}
                      </span>
                    )}
                    <ExternalLink size={14} className="text-[#A1A1A1] group-hover:text-[#FF4500] transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Skills */}
      <section className="mt-6 bg-white border border-[#E2E0D8] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-medium">Skills</h2>
          {editing && (
            <button
              onClick={() => {
                const skill = window.prompt("Add a skill");
                if (skill) updateDraft({ skills: [...(draft.skills || []), skill] });
              }}
              className="flex items-center gap-1 text-xs font-mono tracking-widest uppercase text-[#6B6B6B] hover:text-[#121212]"
            >
              <Plus size={12} /> Add
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(value.skills || []).map((skill, i) => (
            <span
              key={i}
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0EFEA] border border-[#E2E0D8] text-sm text-[#121212]"
            >
              {skill}
              {editing && (
                <button
                  onClick={() =>
                    updateDraft({
                      skills: draft.skills.filter((_, j) => j !== i),
                    })
                  }
                  className="text-[#A1A1A1] hover:text-[#FF4500]"
                >
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
          {(!value.skills || value.skills.length === 0) && (
            <p className="text-sm text-[#A1A1A1]">No skills added yet.</p>
          )}
        </div>
      </section>

      {/* Links */}
      <section className="mt-6 bg-white border border-[#E2E0D8] rounded-2xl p-6">
        <h2 className="font-heading text-xl font-medium mb-4">Links</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { key: "github", label: "GitHub", icon: Github, prefix: "github.com/" },
            { key: "linkedin", label: "LinkedIn", icon: Linkedin, prefix: "linkedin.com/in/" },
            { key: "website", label: "Website", icon: Globe, prefix: "" },
          ].map(({ key, label, icon: Icon, prefix }) => (
            <div
              key={key}
              className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E0D8] bg-[#FAF9F6]"
            >
              <Icon size={16} className="shrink-0" />
              {editing ? (
                <input
                  value={draft.links?.[key] || ""}
                  onChange={(e) =>
                    updateDraft({
                      links: { ...(draft.links || {}), [key]: e.target.value },
                    })
                  }
                  placeholder={`${prefix}username`}
                  className="bg-transparent outline-none text-sm flex-1 min-w-0"
                />
              ) : value.links?.[key] ? (
                <a
                  href={
                    value.links[key].startsWith("http")
                      ? value.links[key]
                      : `https://${prefix}${value.links[key]}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm truncate flex-1 hover:text-[#FF4500]"
                >
                  {value.links[key]}
                </a>
              ) : (
                <span className="text-sm text-[#A1A1A1] truncate">
                  No {label} added
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, unit, tone }) {
  const toneColor =
    tone === "success"
      ? "text-[#4A5D23]"
      : tone === "accent"
      ? "text-[#FF4500]"
      : "text-[#121212]";
  return (
    <div className="bg-white border border-[#E2E0D8] rounded-2xl p-5 card-lift">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={toneColor} />
        <span className="font-mono text-[10px] tracking-widest uppercase text-[#A1A1A1]">
          {label}
        </span>
      </div>
      <div className="font-heading text-3xl md:text-4xl font-bold text-[#121212] leading-none">
        {value}
        {unit && (
          <span className="font-mono text-xs text-[#A1A1A1] ml-1">{unit}</span>
        )}
      </div>
    </div>
  );
}
