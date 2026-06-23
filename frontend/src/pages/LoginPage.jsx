import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import api from "../api";
import { useI18n, LanguageSelector } from "../i18n/index.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) return setError(t("login.invalidEmail"));
    if (password.length < 6) return setError(t("login.shortPassword"));

    try {
      setLoading(true);

      const res = await api.post("/auth/login", { email, password });
      const data = res.data;

      console.log("LOGIN RESPONSE:", data);
      const token = data.token || data.accessToken;

      if (!token) throw new Error("Token not found in response");

      localStorage.setItem("token", token);

      const user = data.user || { email: data.email, role: data.role };
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      if (user.role === "ROLE_ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "";
      if (msg.startsWith("EMAIL_NOT_VERIFIED:")) {
        const unverifiedEmail = msg.split(":")[1];
        navigate("/verify-otp", { state: { email: unverifiedEmail } });
        return;
      }
      setError(msg || t("login.wrongCreds"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-200 to-gray-300 px-4">

      {/* Language selector — top right */}
      <div className="fixed top-4 end-4 z-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-1">
          <LanguageSelector variant="dashboard" />
        </div>
      </div>

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md text-center bg-white rounded-2xl px-8 py-8 shadow-xl space-y-5"
      >
        <div className="flex justify-center">
          <img src="/logo.png" alt="Logo" className="w-32 object-contain" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900">{t("login.title")}</h1>
        <p className="text-gray-500 text-sm">{t("login.subtitle")}</p>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2 mt-6">
          <Mail size={16} className="text-gray-400" />
          <input
            type="email"
            placeholder={t("login.emailPlaceholder")}
            className="w-full bg-transparent outline-none text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2 mt-4">
          <Lock size={16} className="text-gray-400" />
          <input
            type="password"
            placeholder={t("login.passwordPlaceholder")}
            className="w-full bg-transparent outline-none text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="mt-6 w-full h-11 rounded-full text-white bg-red-600 hover:bg-red-700 transition"
        >
          {loading ? t("login.loading") : t("login.submit")}
        </button>

        <p className="text-gray-500 text-sm mt-4">
          {t("login.noAccount")}{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-red-600 cursor-pointer hover:underline"
          >
            {t("login.signUp")}
          </span>
        </p>
      </form>
    </div>
  );
}
