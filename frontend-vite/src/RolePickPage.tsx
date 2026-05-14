import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { chooseRole, getMe } from "./lib/api";

/**
 * First-time role selection screen.
 *
 * Routing logic:
 *   * If the user isn't logged in (401 from /me), go to landing.
 *   * If the user is already role-locked, skip straight to /app.
 *   * Otherwise show two cards: Teacher vs Student. Choice is final.
 */
export const RolePickPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState<string>("");
  const [submitting, setSubmitting] = useState<"teacher" | "student" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me?.role_locked) {
          navigate("/app", { replace: true });
          return;
        }
        setName(me?.name ?? "");
        setReady(true);
      })
      .catch(() => navigate("/", { replace: true }));
  }, [navigate]);

  const pick = async (role: "teacher" | "student") => {
    setSubmitting(role);
    setError(null);
    try {
      await chooseRole(role);
      navigate("/app", { replace: true });
    } catch {
      setError(t("auth.rolePick.error"));
      setSubmitting(null);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
        <span className="h-5 w-5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full text-center mb-10">
        <h1 className="text-3xl font-semibold mb-3">
          {name ? t("auth.rolePick.welcomeNamed", { name }) : t("auth.rolePick.welcome")}
        </h1>
        <p className="text-slate-400 text-base">
          {t("auth.rolePick.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 w-full max-w-3xl">
        <button
          onClick={() => pick("teacher")}
          disabled={submitting !== null}
          className="text-left p-6 rounded-2xl border border-slate-800 bg-slate-900 hover:border-sky-500 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-lg font-semibold mb-2">{t("auth.rolePick.teacherTitle")}</div>
          <div className="text-sm text-slate-400">
            {t("auth.rolePick.teacherDesc")}
          </div>
          {submitting === "teacher" && (
            <div className="mt-3 text-xs text-sky-400">{t("auth.rolePick.settingUp")}</div>
          )}
        </button>

        <button
          onClick={() => pick("student")}
          disabled={submitting !== null}
          className="text-left p-6 rounded-2xl border border-slate-800 bg-slate-900 hover:border-emerald-500 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-lg font-semibold mb-2">{t("auth.rolePick.studentTitle")}</div>
          <div className="text-sm text-slate-400">
            {t("auth.rolePick.studentDesc")}
          </div>
          {submitting === "student" && (
            <div className="mt-3 text-xs text-emerald-400">{t("auth.rolePick.settingUp")}</div>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-6 text-sm text-red-400">{error}</div>
      )}

      <div className="mt-10 text-xs text-slate-500 max-w-xl text-center">
        {t("auth.rolePick.footnote")}
      </div>
    </div>
  );
};
