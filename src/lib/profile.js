// Lightweight client-side profile store backed by localStorage.
// Profile picture is stored as a base64 data URL so it survives reloads
// without needing backend storage.

const KEY = "mockify_profile_v1";

const DEFAULT_PROFILE = {
  name: "Your Name",
  headline: "Software Engineer · Open to opportunities",
  bio: "Practicing my craft, one mock at a time.",
  location: "Remote",
  pronouns: "",
  picture: "", // base64 data URL or empty
  banner: "", // optional cover banner data URL
  skills: ["System Design", "Algorithms", "Communication"],
  links: { github: "", linkedin: "", website: "" },
};

export function loadProfile() {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch (e) {
    // Picture data may be too large — strip it as a fallback.
    try {
      const slim = { ...profile, picture: "", banner: "" };
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch {
      // ignore
    }
  }
}

export function fileToDataUrl(file, maxBytes = 1.5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("no file"));
    if (file.size > maxBytes) {
      return reject(new Error("Image too large (max 1.5 MB)"));
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}
