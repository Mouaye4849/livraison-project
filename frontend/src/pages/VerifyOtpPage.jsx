import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import { useI18n, LanguageSelector } from "../i18n/index.jsx";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;
const EXPIRY_SECONDS = 10 * 60;

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const email = location.state?.email;

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiryLeft, setExpiryLeft] = useState(EXPIRY_SECONDS);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  useEffect(() => {
    if (expiryLeft <= 0) return;
    const timer = setInterval(() => setExpiryLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [expiryLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted.length > 0) {
      const next = Array(OTP_LENGTH).fill("");
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
      setDigits(next);
      inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = digits.join("");

    if (code.length < OTP_LENGTH) {
      return setError(t("otp.enterFullCode"));
    }

    setError("");

    try {
      setLoading(true);

      const res = await api.post("/auth/verify-otp", {
        email,
        code,
      });

      localStorage.setItem("token", res.data.token);

      localStorage.setItem(
        "user",
        JSON.stringify({
          email: res.data.email,
          role: res.data.role,
        })
      );

      localStorage.setItem("role", res.data.role);

      setSuccess(true);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (err) {
      setError(
        err.response?.data?.message || t("otp.invalidCode")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await api.post("/auth/resend-otp", { email });
      setResendCooldown(RESEND_COOLDOWN);
      setExpiryLeft(EXPIRY_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err.response?.data?.message || t("otp.resendFailed"));
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 px-4">

      <div className="fixed top-4 end-4 z-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-1">
          <LanguageSelector variant="dashboard" />
        </div>
      </div>

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl px-8 py-10 space-y-6 text-center">

        <div className="flex justify-center">
          <img src="/logo.png" alt="Logo" className="w-34 object-contain" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t("otp.title")}</h1>
          <p className="text-gray-500 text-sm mt-2">
            {t("otp.emailSentTo")}{" "}
            <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        {success ? (
          <div className="py-6 text-green-600 font-medium text-lg">{t("otp.success")}</div>
        ) : (
          <>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 text-center text-xl font-bold border-2 border-gray-200 rounded-xl outline-none focus:border-red-500 transition bg-gray-50"
                  style={{ height: "52px" }}
                />
              ))}
            </div>

            {expiryLeft > 0 ? (
              <p className="text-sm text-gray-400">
                {t("otp.expiresIn")}{" "}
                <span className={expiryLeft < 60 ? "text-red-500 font-semibold" : "font-medium text-gray-600"}>
                  {formatTime(expiryLeft)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-500">{t("otp.expired")}</p>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleVerify}
              disabled={loading || expiryLeft <= 0}
              className="w-full h-11 rounded-full text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? t("otp.loading") : t("otp.verify")}
            </button>

            <p className="text-sm text-gray-500">
              {t("otp.noCode")}{" "}
              {resendCooldown > 0 ? (
                <span className="text-gray-400">
                  {t("otp.resendIn")} {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-red-600 hover:underline font-medium"
                >
                  {t("otp.resend")}
                </button>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
