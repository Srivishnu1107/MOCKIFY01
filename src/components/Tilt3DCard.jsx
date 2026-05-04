import { useRef, useEffect } from "react";

/**
 * Tilt3DCard — A premium 3D presentation frame.
 * Tracks mouse position and applies perspective rotation to produce a
 * holographic / studio-rendered feel on the avatar portrait.
 */
export default function Tilt3DCard({ children, className = "", intensity = 14, speaking = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rx = (y - 0.5) * -intensity;
      const ry = (x - 0.5) * intensity;
      el.style.setProperty("--rx", `${rx}deg`);
      el.style.setProperty("--ry", `${ry}deg`);
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
    };
    const onLeave = () => {
      el.style.setProperty("--rx", `0deg`);
      el.style.setProperty("--ry", `0deg`);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [intensity]);

  return (
    <div
      ref={ref}
      className={`tilt-3d ${speaking ? "tilt-3d-live" : ""} ${className}`}
      style={{
        perspective: "1200px",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
}
