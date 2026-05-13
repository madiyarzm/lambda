import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMe } from "./lib/api";

const ERROR_LABELS: Record<string, string> = {
  state_mismatch: "Login was cancelled or expired. Please try again.",
  token_exchange_failed: "Google didn't return a usable token. Please try again.",
  email_not_verified: "Your Google email isn't verified. Verify it with Google, then try again.",
  account_conflict: "An account with this email already exists. Please contact support.",
  auth_failed: "Authentication failed. Please try again.",
};

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The backend set an httpOnly auth cookie before redirecting here.
    // Check if this is a new account (role not yet chosen) and route to the
    // role-pick screen before the main app.
    const err = searchParams.get("error");
    if (err) {
      setError(ERROR_LABELS[err] ?? ERROR_LABELS.auth_failed);
      return;
    }
    getMe()
      .then((me) => {
        if (me?.role_locked) {
          navigate("/app", { replace: true });
        } else {
          navigate("/welcome/role", { replace: true });
        }
      })
      .catch(() => setError(ERROR_LABELS.auth_failed));
  }, [navigate, searchParams]);

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
