import { useEffect, useMemo, useState } from "react";
import { avatarImage } from "../lib/avatars";

/**
 * AnimatedPersona
 * Renders an AI interviewer as an SVG portrait with:
 *   • Two stacked expressions ("listening" base + "engaged" cross-fade)
 *   • Optional head-nod animation while speaking
 *   • Attentive idle head movement when not speaking
 *
 * The cross-fade simulates micro facial movements (eyebrow raise + smile)
 * that would normally require a full 3D rig.
 */
export default function AnimatedPersona({
  avatar,
  speaking = false,
  className = "",
  imgClassName = "",
}) {
  const listening = useMemo(() => avatarImage(avatar, "listening"), [avatar]);
  const engaged = useMemo(() => avatarImage(avatar, "engaged"), [avatar]);

  // Preload the engaged expression so the first cross-fade doesn't flash blank.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const img = new Image();
    img.src = engaged;
  }, [engaged]);

  return (
    <div
      className={`relative w-full h-full flex items-end justify-center ${
        speaking ? "head-nod" : "head-attentive"
      } ${className}`}
    >
      <img
        src={listening}
        alt={avatar.name}
        className={`absolute inset-0 w-full h-full object-contain object-bottom ${imgClassName}`}
      />
      <img
        src={engaged}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-contain object-bottom ${
          speaking ? "expression-engaged" : "expression-engaged-idle"
        } ${imgClassName}`}
      />
    </div>
  );
}
