/**
 * AIRAAvatar — Animated anime-style AI Recruitment Assistant avatar.
 *
 * Supports 5 expression states:
 *   greeting   → warm smile, open eyes
 *   speaking   → animated mouth (open/close loop), normal eyes
 *   listening  → attentive, slight head tilt feel, normal expression
 *   thinking   → eyes glance up-left, thoughtful brow
 *   encouraging → big closed-eye smile, celebratory
 *
 * Animations:
 *   - Auto-blink every ~3.5s during idle/listening states
 *   - Mouth cycle animation during speaking
 *   - Subtle floating idle animation on the whole SVG
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type AIRAState = "greeting" | "speaking" | "listening" | "thinking" | "encouraging";

interface AIRAProps {
  state: AIRAState;
  className?: string;
}

// Mouth shape paths for speaking animation (4 keyframes cycling)
const MOUTH_SHAPES = {
  closed:     "M 135 185 Q 150 190 165 185",
  small:      "M 133 184 Q 150 196 167 184",
  medium:     "M 130 183 Q 150 202 170 183",
  wide:       "M 128 182 Q 150 206 172 182",
  smile:      "M 132 184 Q 150 198 168 184",
  bigSmile:   "M 128 182 Q 150 205 172 182",
  smileClosed:"M 132 184 Q 150 194 168 184",
};

const STATE_LABEL: Record<AIRAState, string> = {
  greeting:    "Hello! I'm AIRA",
  speaking:    "AIRA is speaking…",
  listening:   "AIRA is listening…",
  thinking:    "AIRA is thinking…",
  encouraging: "Great answer!",
};

const STATE_GLOW: Record<AIRAState, string> = {
  greeting:    "rgba(139,92,246,0.35)",
  speaking:    "rgba(59,130,246,0.35)",
  listening:   "rgba(16,185,129,0.35)",
  thinking:    "rgba(245,158,11,0.35)",
  encouraging: "rgba(236,72,153,0.35)",
};

export function AIRAAvatar({ state, className = "" }: AIRAProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouthTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Blink loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 2000;
      blinkTimer.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };

    if (state !== "thinking" && state !== "encouraging") {
      scheduleBlink();
    }

    return () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
  }, [state]);

  // ── Mouth animation during speaking ─────────────────────────────────────
  useEffect(() => {
    if (state === "speaking") {
      const frames = [0, 1, 2, 3, 2, 1];
      let i = 0;
      mouthTimer.current = setInterval(() => {
        setMouthFrame(frames[i % frames.length]);
        i++;
      }, 120);
    } else {
      if (mouthTimer.current) clearInterval(mouthTimer.current);
      setMouthFrame(0);
    }
    return () => { if (mouthTimer.current) clearInterval(mouthTimer.current); };
  }, [state]);

  // Derive current mouth path
  const mouthPath = (() => {
    if (state === "encouraging") return MOUTH_SHAPES.bigSmile;
    if (state === "greeting")    return MOUTH_SHAPES.smile;
    if (state === "thinking")    return MOUTH_SHAPES.smileClosed;
    if (state === "speaking") {
      const paths = [MOUTH_SHAPES.small, MOUTH_SHAPES.medium, MOUTH_SHAPES.wide, MOUTH_SHAPES.medium];
      return paths[mouthFrame] ?? MOUTH_SHAPES.small;
    }
    return MOUTH_SHAPES.closed;
  })();

  // Eye Y for thinking (glance up)
  const eyeOffset = state === "thinking" ? -3 : 0;

  // Eye closed for blink or encouraging
  const eyesClosed = isBlinking || state === "encouraging";

  return (
    <div className={`flex flex-col items-center gap-3 select-none ${className}`}>
      {/* Glow + floating wrapper */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        {/* Outer glow ring */}
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.04, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[-16px] rounded-full blur-2xl pointer-events-none"
          style={{ background: STATE_GLOW[state] }}
        />

        {/* SVG Avatar */}
        <svg
          width="240"
          height="310"
          viewBox="0 0 300 400"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl"
        >
          <defs>
            <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFE0CC" />
              <stop offset="100%" stopColor="#FFCBA4" />
            </radialGradient>
            <radialGradient id="hairGrad" cx="50%" cy="20%" r="70%">
              <stop offset="0%" stopColor="#2D1B69" />
              <stop offset="100%" stopColor="#1A0A3C" />
            </radialGradient>
            <radialGradient id="blazerGrad" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#4C3AA3" />
              <stop offset="100%" stopColor="#2D1B69" />
            </radialGradient>
            <radialGradient id="eyeGrad" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#7B5EA7" />
              <stop offset="100%" stopColor="#3D1F6E" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <clipPath id="faceClip">
              <ellipse cx="150" cy="155" rx="78" ry="88" />
            </clipPath>
          </defs>

          {/* ── Body / Blazer ── */}
          <path
            d="M 60 310 Q 55 270 70 250 L 105 230 L 110 260 L 150 248 L 190 260 L 195 230 L 230 250 Q 245 270 240 310 Z"
            fill="url(#blazerGrad)"
          />
          {/* Collar / shirt */}
          <path
            d="M 115 232 L 150 248 L 185 232 L 175 215 L 150 228 L 125 215 Z"
            fill="#F0EEF8"
          />
          {/* Tie / pendant hint */}
          <path d="M 148 228 L 152 228 L 155 248 L 150 252 L 145 248 Z" fill="#C084FC" />

          {/* ── Shoulders ── */}
          <ellipse cx="88" cy="238" rx="28" ry="18" fill="url(#blazerGrad)" />
          <ellipse cx="212" cy="238" rx="28" ry="18" fill="url(#blazerGrad)" />

          {/* ── Neck ── */}
          <rect x="135" y="208" width="30" height="26" rx="10" fill="url(#skinGrad)" />

          {/* ── Hair Back ── */}
          <path
            d="M 75 145 Q 68 90 85 65 Q 100 38 150 32 Q 200 38 215 65 Q 232 90 225 145 Z"
            fill="url(#hairGrad)"
          />
          {/* Hair side strands */}
          <path
            d="M 78 148 Q 62 175 68 210 Q 72 235 85 245 Q 75 220 80 190 Z"
            fill="url(#hairGrad)"
          />
          <path
            d="M 222 148 Q 238 175 232 210 Q 228 235 215 245 Q 225 220 220 190 Z"
            fill="url(#hairGrad)"
          />

          {/* ── Face ── */}
          <ellipse cx="150" cy="155" rx="78" ry="88" fill="url(#skinGrad)" />

          {/* ── Ear detail ── */}
          <ellipse cx="74" cy="158" rx="8" ry="11" fill="#FFCBA4" />
          <ellipse cx="226" cy="158" rx="8" ry="11" fill="#FFCBA4" />

          {/* ── Blush / cheeks ── */}
          <ellipse cx="112" cy="175" rx="18" ry="10" fill="#FFB0A0" opacity="0.35" />
          <ellipse cx="188" cy="175" rx="18" ry="10" fill="#FFB0A0" opacity="0.35" />

          {/* ── Eyebrows ── */}
          {state === "thinking" ? (
            <>
              {/* Raised right brow, furrowed left */}
              <path d="M 108 112 Q 122 106 136 110" stroke="#4A2C8A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M 164 108 Q 178 105 192 112" stroke="#4A2C8A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          ) : state === "encouraging" ? (
            <>
              <path d="M 108 112 Q 122 105 136 110" stroke="#4A2C8A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M 164 110 Q 178 105 192 112" stroke="#4A2C8A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M 108 115 Q 122 110 136 113" stroke="#4A2C8A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M 164 113 Q 178 110 192 115" stroke="#4A2C8A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* ── Eyes ── */}
          {eyesClosed ? (
            <>
              {/* Closed eyes — curved line */}
              <path d="M 112 138 Q 122 133 132 138" stroke="#4A2C8A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 168 138 Q 178 133 188 138" stroke="#4A2C8A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* lashes */}
              <path d="M 114 138 L 111 133 M 122 135 L 122 130 M 130 138 L 133 133" stroke="#4A2C8A" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 170 138 L 167 133 M 178 135 L 178 130 M 186 138 L 189 133" stroke="#4A2C8A" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Left eye */}
              <ellipse cx="122" cy={138 + eyeOffset} rx="18" ry="16" fill="url(#eyeGrad)" />
              <ellipse cx="122" cy={138 + eyeOffset} rx="18" ry="16" fill="none" stroke="#2D1B69" strokeWidth="2.5" />
              <ellipse cx="122" cy={138 + eyeOffset} rx="11" ry="11" fill="#1A0A3C" />
              <ellipse cx="122" cy={138 + eyeOffset} rx="7" ry="8" fill="#3D1F6E" />
              {/* Pupil shine */}
              <circle cx="127" cy={134 + eyeOffset} r="3" fill="white" opacity="0.9" />
              <circle cx="117" cy={141 + eyeOffset} r="1.5" fill="white" opacity="0.5" />
              {/* Lashes */}
              <path d={`M 106 ${133 + eyeOffset} Q 110 ${126 + eyeOffset} 115 ${126 + eyeOffset}`} stroke="#2D1B69" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d={`M 122 ${122 + eyeOffset} L 122 ${118 + eyeOffset}`} stroke="#2D1B69" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d={`M 130 ${124 + eyeOffset} Q 136 ${118 + eyeOffset} 138 ${125 + eyeOffset}`} stroke="#2D1B69" strokeWidth="2" fill="none" strokeLinecap="round" />

              {/* Right eye */}
              <ellipse cx="178" cy={138 + eyeOffset} rx="18" ry="16" fill="url(#eyeGrad)" />
              <ellipse cx="178" cy={138 + eyeOffset} rx="18" ry="16" fill="none" stroke="#2D1B69" strokeWidth="2.5" />
              <ellipse cx="178" cy={138 + eyeOffset} rx="11" ry="11" fill="#1A0A3C" />
              <ellipse cx="178" cy={138 + eyeOffset} rx="7" ry="8" fill="#3D1F6E" />
              <circle cx="183" cy={134 + eyeOffset} r="3" fill="white" opacity="0.9" />
              <circle cx="173" cy={141 + eyeOffset} r="1.5" fill="white" opacity="0.5" />
              <path d={`M 162 ${133 + eyeOffset} Q 166 ${126 + eyeOffset} 171 ${126 + eyeOffset}`} stroke="#2D1B69" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d={`M 178 ${122 + eyeOffset} L 178 ${118 + eyeOffset}`} stroke="#2D1B69" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d={`M 186 ${124 + eyeOffset} Q 192 ${118 + eyeOffset} 194 ${125 + eyeOffset}`} stroke="#2D1B69" strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* ── Nose ── */}
          <path d="M 148 162 Q 150 172 154 170 Q 158 168 156 162" stroke="#D4956E" strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" />

          {/* ── Mouth (animated) ── */}
          <motion.path
            d={mouthPath}
            stroke="#C0625A"
            strokeWidth="2.5"
            fill={state === "speaking" && mouthFrame > 0 ? "#C8523C" : "none"}
            strokeLinecap="round"
            animate={{ d: mouthPath }}
            transition={{ duration: 0.08 }}
          />
          {/* Teeth visible when mouth open */}
          {state === "speaking" && mouthFrame >= 2 && (
            <motion.path
              d="M 136 187 Q 150 192 164 187 L 164 193 Q 150 197 136 193 Z"
              fill="white"
              opacity={0.9}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
            />
          )}

          {/* ── Hair Front / Bangs ── */}
          <path
            d="M 80 120 Q 78 80 90 60 Q 100 40 130 35 L 125 55 Q 110 58 105 80 Q 100 100 105 125 Z"
            fill="url(#hairGrad)"
          />
          <path
            d="M 82 135 Q 78 115 85 95 Q 90 80 100 75 L 98 95 Q 95 110 100 130 Z"
            fill="url(#hairGrad)" opacity="0.8"
          />
          {/* Right side bangs */}
          <path
            d="M 220 120 Q 222 80 210 60 Q 200 40 170 35 L 175 55 Q 190 58 195 80 Q 200 100 195 125 Z"
            fill="url(#hairGrad)"
          />
          {/* Top hair strand accent */}
          <path
            d="M 148 32 Q 150 20 155 18 Q 162 15 165 25 Q 160 28 158 35 Z"
            fill="#9B7FD4"
          />

          {/* ── Hair accessories — star clip ── */}
          <g filter="url(#glow)">
            <path d="M 95 105 L 97 100 L 99 105 L 104 105 L 100 108 L 102 113 L 97 110 L 92 113 L 94 108 L 90 105 Z"
              fill="#F472B6" opacity="0.9" />
          </g>

          {/* ── Thinking sparkles ── */}
          {state === "thinking" && (
            <g opacity="0.8">
              <motion.text x="200" y="100" fontSize="14" textAnchor="middle"
                animate={{ opacity: [0, 1, 0], y: [100, 85, 70] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>
                💭
              </motion.text>
              <motion.circle cx="215" cy="95" r="3" fill="#FCD34D"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
              <motion.circle cx="225" cy="80" r="5" fill="#FCD34D"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />
              <motion.circle cx="240" cy="65" r="8" fill="#FCD34D" opacity="0.6"
                animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.9 }} />
            </g>
          )}

          {/* ── Encouraging sparkles ── */}
          {state === "encouraging" && (
            <g>
              {["✨", "⭐", "🌟"].map((e, i) => (
                <motion.text key={i} x={80 + i * 70} y="80" fontSize="16" textAnchor="middle"
                  animate={{ opacity: [0, 1, 0], y: [80, 60, 40], scale: [0.5, 1.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}>
                  {e}
                </motion.text>
              ))}
            </g>
          )}
        </svg>
      </motion.div>

      {/* Name plate */}
      <div className="text-center">
        <div className="flex items-center gap-2 justify-center">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-violet-400"
          />
          <span className="text-xs font-bold text-violet-300 tracking-[0.2em] uppercase font-mono">
            AIRA
          </span>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="w-2 h-2 rounded-full bg-violet-400"
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={state}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-[10px] text-slate-400 font-mono mt-0.5"
          >
            {STATE_LABEL[state]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
