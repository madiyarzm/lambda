import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveToken } from "./lib/api";

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Token is delivered in the URL hash fragment (not query string) so it
    // never appears in server logs or Referer headers.
    const token = window.location.hash.substring(1) || null;
    const err = searchParams.get("error");

    if (token) {
      saveToken(token);
      navigate("/app", { replace: true });
    } else {
      setError(err || "Authentication failed. Please try again.");
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-sm">{error}</div>
        <button
          onClick={() => navigate("/", { replace: true })}
          className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm transition-colors"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
      <div className="flex items-center gap-3 text-sm">
        <span className="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        Signing you in…
      </div>
    </div>
  );
};
