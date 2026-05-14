import React from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n";

/**
 * Compact EN / RU / KK segmented control.
 *
 * Takes a `variant` so it stays legible on different surfaces:
 *  - `light` — the landing page's white glass nav (tinted track so the pill
 *    is distinguishable instead of blending into the white bar).
 *  - `dark`  — the app's dark sidebar / headers (uses theme CSS vars).
 *  - `glass` — on top of a coloured background (e.g. the student profile
 *    hero), matching the translucent "glass on colour" button style.
 */
type Variant = "light" | "dark" | "glass";

interface LanguageSwitcherProps {
  variant?: Variant;
  className?: string;
}

const PALETTE: Record<
  Variant,
  { track: string; border: string; idle: string; activeBg: string; activeText: string }
> = {
  light: {
    track: "rgba(15,23,42,0.05)",
    border: "rgba(15,23,42,0.12)",
    idle: "#52525B",
    activeBg: "#0A0A0B",
    activeText: "#ffffff",
  },
  dark: {
    track: "var(--bg-3)",
    border: "var(--border)",
    idle: "var(--text-3)",
    activeBg: "var(--bg)",
    activeText: "var(--text)",
  },
  glass: {
    track: "rgba(255,255,255,0.15)",
    border: "rgba(255,255,255,0.3)",
    idle: "rgba(255,255,255,0.75)",
    activeBg: "rgba(255,255,255,0.92)",
    activeText: "#1f2937",
  },
};

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "dark",
  className = "",
}) => {
  const { i18n } = useTranslation();
  const p = PALETTE[variant];
  const current = i18n.language?.split("-")[0] ?? "en";

  return (
    <div
      className={className}
      role="group"
      aria-label="Language"
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 2,
        borderRadius: 999,
        background: p.track,
        border: `1px solid ${p.border}`,
      }}
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        const active = current === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => void i18n.changeLanguage(lang.code)}
            title={lang.name}
            aria-pressed={active}
            style={{
              padding: "3px 9px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1.4,
              background: active ? p.activeBg : "transparent",
              color: active ? p.activeText : p.idle,
              boxShadow: active && variant !== "glass" ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
              transition: "background 120ms, color 120ms",
            }}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};
