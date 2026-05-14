import React from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n";

/**
 * Compact EN / RU / KK segmented control.
 *
 * The landing page is light and the app is dark, so the switcher takes a
 * `variant` prop and picks a palette accordingly. `dark` uses the app's CSS
 * variables; `light` uses the landing page's Apple-style palette.
 */
type Variant = "light" | "dark";

interface LanguageSwitcherProps {
  variant?: Variant;
  className?: string;
}

const PALETTE: Record<
  Variant,
  { track: string; border: string; idle: string; activeBg: string; activeText: string }
> = {
  light: {
    track: "rgba(255,255,255,0.6)",
    border: "var(--apple-line, rgba(0,0,0,0.08))",
    idle: "var(--apple-ink-3, #6b7280)",
    activeBg: "var(--apple-ink, #1f2937)",
    activeText: "#ffffff",
  },
  dark: {
    track: "var(--bg-3)",
    border: "var(--border)",
    idle: "var(--text-3)",
    activeBg: "var(--bg)",
    activeText: "var(--text)",
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
              boxShadow: active && variant === "dark" ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
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
