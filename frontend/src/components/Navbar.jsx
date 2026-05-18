import NotificationBell from "./NotificationBell";
import { LogOut, User } from "lucide-react";
import AdminPendingTrajets from "../pages/AdminPendingTrajets";

export default function Navbar({ onLogout }) {

    const user = JSON.parse(localStorage.getItem("user"));

    return (
        <div className="flex justify-between items-center px-6 py-4 bg-black/30 backdrop-blur border-b border-white/10">

            {/* LEFT */}
            <h1 className="text-lg font-bold">
                Livraison Dashboard
            </h1>

            {/* RIGHT */}
            <div className="flex items-center gap-4">


                <NotificationBell />

                {/* 👤 User */}
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <User size={16} />
                    {user?.email}
                </div>

                {/* 🚪 Logout */}
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300"
                >
                    <LogOut size={16} />
                    Logout
                </button>

            </div>
        </div>
    );
}