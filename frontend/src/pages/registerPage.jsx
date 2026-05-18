import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import api from "../api";

export default function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const role = location.state?.role;

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGoogleSignup = async () => {
        try {
            const result = await signInWithPopup(auth, provider);

            const user = result.user;


            const googleData = {
                name: user.displayName,
                email: user.email,
                googleId: user.uid,
            };


            const res = await api.post("/auth/google", googleData);


            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify({
                role: res.data.role
            }));


            navigate("/dashboard");

        } catch (err) {
            console.error(err);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (name.length < 2) return setError("Le nom doit contenir au moins 2 caracteres");
        if (!email.includes("@")) return setError("Email invalide");
        if (password.length < 6)
            return setError("Le mot de passe doit contenir au moins 6 caracteres");

        try {
            setLoading(true);

            const endpoint =
                role === "VOYAGEUR"
                    ? "/auth/register/voyageur"
                    : "/auth/register/client";

            await api.post(endpoint, { name, email, password });

            navigate("/login", { state: { role } });
        } catch (err) {
            setError(err.response?.data?.message || "Register failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 px-4">

            <form
                onSubmit={handleRegister}
                className="w-full max-w-md bg-white shadow-xl rounded-2xl px-8 py-10 space-y-5"
            >
                {/* LOGO */}
                <div className="flex justify-center">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-34 object-contain"
                    />
                </div>

                {/* TITLE */}
                <div className="text-center">
                    <h1 className="text-gray-900 text-2xl font-semibold">
                        Create account
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Join WASALI platform
                    </p>
                </div>

                {/* GOOGLE BUTTON */}
                <button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="w-full flex items-center justify-center gap-3 border border-gray-300 h-11 rounded-full bg-white hover:bg-gray-100 transition"
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="google"
                        className="w-5 h-5"
                    />
                    <span className="text-gray-700 font-medium">
                        Sign up with Google
                    </span>
                </button>

                {/* OR */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="text-gray-400 text-sm">or</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* ERROR */}
                {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                {/* NAME */}
                <div className="flex items-center bg-gray-100 h-12 rounded-full px-4 gap-2">
                    <User size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Full name"
                        className="w-full bg-transparent outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                {/* EMAIL */}
                <div className="flex items-center bg-gray-100 h-12 rounded-full px-4 gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <input
                        type="email"
                        placeholder="Email address"
                        className="w-full bg-transparent outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                {/* PASSWORD */}
                <div className="flex items-center bg-gray-100 h-12 rounded-full px-4 gap-2">
                    <Lock size={16} className="text-gray-400" />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full bg-transparent outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {/* ROLE */}
                <p className="text-xs text-gray-500 text-center">
                    {role === "VOYAGEUR"
                        ? "Compte Voyageur 🚚"
                        : "Compte Client 👤"}
                </p>

                {/* BUTTON */}
                <button
                    type="submit"
                    className="mt-6 w-full h-11 rounded-full text-white bg-red-600 hover:bg-red-700 transition"
                >
                    {loading ? "Loading..." : "Créer un compte"}
                </button>

                {/* LOGIN */}
                <p className="text-gray-500 text-sm text-center">
                    Already have an account?
                    <span
                        onClick={() => navigate("/login")}
                        className="text-red-600 cursor-pointer hover:underline"
                    >
                        Login
                    </span>
                </p>
            </form>
        </div>
    );
}