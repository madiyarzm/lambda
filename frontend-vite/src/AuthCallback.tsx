import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMe } from "./lib/api";

// Error codes the backend can redirect with. Each maps to a translation key
// under auth.callback.* — see i18n/locales.
const ERROR_CODES = [
  "state_mismatch",
  "token_exchange_failed",
  "email_not_verified",
  "account_conflict",
  "auth_failed",
] as const;

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    // The backend set an httpOnly auth cookie before redirecting here.
    // Check if this is a new account (role not yet chosen) and route to the
    // role-pick screen before the main app.
    const err = searchParams.get("error");
    if (err) {
      setErrorCode(ERROR_CODES.includes(err as typeof ERROR_CODES[number]) ? err : "auth_failed");
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
      .catch(() => setErrorCode("auth_failed"));
  }, [navigate, searchParams]);

  if (errorCode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-sm">{t(`auth.callback.${errorCode}`)}</div>
        <button
          onClick={() => navigate("/", { replace: true })}
          className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm transition-colors"
        >
          {t("auth.callback.backHome")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
      <div className="flex items-center gap-3 text-sm">
        <span className="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        {t("auth.callback.signingIn")}
      </div>
    </div>
  );
};
