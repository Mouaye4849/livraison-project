import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import api from "../api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");


    if (!email.includes("@")) return setError("Invalid email");
    if (password.length < 6)
      return setError("Password must be at least 6 characters");

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const data = res.data;

      console.log("LOGIN RESPONSE:", data);
      const token = data.token || data.accessToken;

      if (!token) {
        throw new Error("Token not found in response");
      }


      localStorage.setItem("token", token);


      const user = data.user || {
        email: data.email,
        role: data.role,
      };

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

      setError(
        err.response?.data?.message ||
        err.message ||
        "Email ou mot de passe incorrect"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-200 to-gray-300 px-4">

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md text-center bg-white rounded-2xl px-8 py-8 shadow-xl space-y-5"
      >

        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-32 object-contain"
          />
        </div>


        <h1 className="text-3xl font-bold text-gray-900">
          Sign in
        </h1>

        <p className="text-gray-500 text-sm">
          Access your WASALI account
        </p>


        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}


        <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2 mt-6">
          <Mail size={16} className="text-gray-400" />
          <input
            type="email"
            placeholder="Votre adresse email"
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
            placeholder="Votre mot de passe"
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
          {loading ? "Loading..." : "Sign in"}
        </button>


        <p className="text-gray-500 text-sm mt-4">
          Vous n'avez pas de compte ?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-red-600 cursor-pointer hover:underline"
          >
            Inscrivez-vous
          </span>
        </p>

      </form>
    </div>
  );
}