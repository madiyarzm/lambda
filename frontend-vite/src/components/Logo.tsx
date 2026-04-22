export function ChalkLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center rounded-[10px] shrink-0"
        style={{
          width: size,
          height: size,
          background: "var(--indigo)",
        }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            d="M9 1C9 1 10.5 5.5 14 7C10.5 8.5 9 13 9 13C9 13 7.5 8.5 4 7C7.5 5.5 9 1 9 1Z"
            fill="white"
          />
          <path
            d="M9 13C9 13 9.8 15.2 11.5 16C9.8 16.8 9 19 9 19C9 19 8.2 16.8 6.5 16C8.2 15.2 9 13 9 13Z"
            fill="white"
            opacity="0.6"
          />
        </svg>
      </div>
      <span
        style={{
          fontSize: size * 0.56,
          fontWeight: 800,
          color: "var(--text)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        Chalk
      </span>
    </div>
  );
}
