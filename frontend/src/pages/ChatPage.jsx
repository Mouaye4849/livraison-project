import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle,
    Send,
    ImageIcon,
    Mic,
    MicOff,
    Lock,
    Package,
} from "lucide-react";

export default function ChatPage() {
    const { colisId } = useParams();

    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState("");
    const [recording, setRecording] = useState(false);

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    const mediaRecorderRef = useRef(null);
    const messagesEndRef = useRef(null);

    /* ========================= FETCH MESSAGES ========================== */
    const fetchMessages = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/chat/${colisId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [colisId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ========================= SEND TEXT ========================== */
    const sendMessage = async () => {
        if (!content.trim()) return;
        try {
            await fetch("http://localhost:8080/api/chat/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ colisId, content, type: "TEXT" }),
            });
            setContent("");
            fetchMessages();
        } catch (err) {
            console.error("Send text error:", err);
        }
    };

    /* ========================= SEND IMAGE ========================== */
    const sendImage = async (file) => {
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append("file", file);

            const upload = await fetch("http://localhost:8080/api/chat/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const fileUrl = await upload.text();

            await fetch("http://localhost:8080/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ colisId, type: "IMAGE", fileUrl }),
            });
            fetchMessages();
        } catch (err) {
            console.error("Send image error:", err);
        }
    };

    /* ========================= AUDIO RECORD ========================== */
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);

            recorder.onstop = async () => {
                try {
                    const blob = new Blob(chunks, { type: "audio/webm" });
                    const formData = new FormData();
                    formData.append("file", blob);

                    const upload = await fetch("http://localhost:8080/api/chat/upload", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                    });
                    const fileUrl = await upload.text();

                    await fetch("http://localhost:8080/api/chat/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ colisId, type: "AUDIO", fileUrl }),
                    });
                    fetchMessages();
                } catch (err) {
                    console.error("Audio send error:", err);
                }
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setRecording(true);
        } catch (err) {
            console.error("Mic error:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
        setRecording(false);
    };

    /* ========================= UI ========================== */
    return (
        <div className="flex flex-col h-[calc(100vh-120px)] dark:bg-[#080808] bg-white rounded-2xl dark:border-[#1f1f1f] border-gray-200 border overflow-hidden">

            {/* ── HEADER ── */}
            <div className="shrink-0 flex items-center gap-3 px-5 py-3.5 dark:bg-[#0a0a0a]/90 bg-gray-50 backdrop-blur-md dark:border-b dark:border-white/5 border-b border-gray-200">
                <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                    <MessageCircle size={18} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-sm font-bold dark:text-white text-gray-900 truncate">
                            Discussion Colis
                        </h1>
                        <span className="hidden sm:inline-flex items-center gap-1 dark:bg-white/5 bg-gray-200 dark:border-white/10 border-gray-300 border rounded-full px-2 py-0.5 text-[10px] text-gray-500">
                            <Package size={10} />
                            #{colisId}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-[11px] text-gray-400">Communication sécurisée</span>
                    </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-[10px] text-gray-400">
                    <Lock size={10} />
                    <span className="hidden sm:inline">Chiffré</span>
                </div>
            </div>

            {/* ── MESSAGES ── */}
            <div
                className="flex-1 overflow-y-auto px-4 py-5 space-y-3"
                style={{ scrollbarWidth: "none" }}
            >
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>

                {/* EMPTY STATE */}
                {messages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full gap-4 py-20"
                    >
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                            className="w-16 h-16 rounded-2xl dark:bg-white/5 bg-gray-100 dark:border-white/10 border-gray-200 border flex items-center justify-center"
                        >
                            <MessageCircle size={28} className="text-gray-400" />
                        </motion.div>
                        <div className="text-center">
                            <p className="dark:text-white/60 text-gray-600 font-semibold text-sm">Aucun message</p>
                            <p className="text-gray-400 text-xs mt-1">Commencez la discussion</p>
                        </div>
                    </motion.div>
                )}

                {/* MESSAGE BUBBLES */}
                <AnimatePresence>
                    {messages.map((msg, i) => {
                        const isMine = msg.senderEmail === user?.email;

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.22, delay: i < 5 ? i * 0.04 : 0 }}
                                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`relative max-w-[75%] sm:max-w-sm rounded-2xl px-4 py-3 text-sm transition-all duration-200 ${
                                        isMine
                                            ? "bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-700/20 rounded-br-sm"
                                            : "dark:bg-white/[0.06] bg-gray-100 dark:border-white/10 border-gray-200 border shadow-sm rounded-bl-sm"
                                    }`}
                                >
                                    <p className={`text-[10px] font-medium mb-1.5 truncate ${isMine ? "text-blue-200/70" : "text-gray-400"}`}>
                                        {msg.senderEmail}
                                    </p>

                                    {msg.type === "TEXT" && (
                                        <p className={`leading-relaxed text-sm ${isMine ? "text-white" : "dark:text-white text-gray-900"}`}>
                                            {msg.content}
                                        </p>
                                    )}

                                    {msg.type === "IMAGE" && (
                                        <div className="mt-1 overflow-hidden rounded-xl">
                                            <img
                                                src={msg.fileUrl}
                                                alt="image"
                                                className="max-h-52 w-full object-cover rounded-xl hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                                            />
                                        </div>
                                    )}

                                    {msg.type === "AUDIO" && (
                                        <div className="mt-1 dark:bg-white/10 bg-gray-200 rounded-xl px-3 py-2">
                                            <audio
                                                controls
                                                src={msg.fileUrl}
                                                className="w-full max-w-[220px] h-8"
                                                style={{ colorScheme: "dark" }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT BAR ── */}
            <div className="shrink-0 px-4 pb-4 pt-3 dark:border-t dark:border-white/5 border-t border-gray-200 dark:bg-[#0a0a0a]/90 bg-gray-50 backdrop-blur-md">

                {/* Recording indicator */}
                <AnimatePresence>
                    {recording && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 px-4 py-2 mb-2 bg-red-600/10 border border-red-600/20 rounded-xl"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="w-2.5 h-2.5 bg-red-500 rounded-full"
                            />
                            <span className="text-red-400 text-xs font-medium">Enregistrement en cours...</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2">

                    {/* Image upload */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => sendImage(e.target.files[0])}
                        className="hidden"
                        id="imageInput"
                    />
                    <motion.label
                        htmlFor="imageInput"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl dark:bg-white/5 bg-gray-200 dark:border-white/10 border-gray-300 border dark:hover:bg-white/10 hover:bg-gray-300 cursor-pointer transition-colors duration-200 shrink-0"
                    >
                        <ImageIcon size={16} className="text-gray-400" />
                    </motion.label>

                    {/* Text input */}
                    <input
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                        placeholder="Écrire un message..."
                        className="flex-1 h-10 dark:bg-white/[0.05] bg-white dark:border-white/10 border-gray-200 border rounded-xl px-4 text-sm dark:text-white text-gray-900 dark:placeholder:text-gray-500 placeholder:text-gray-400 outline-none dark:focus:border-white/20 focus:border-gray-300 dark:focus:bg-white/[0.07] transition-all duration-200"
                    />

                    {/* Mic button */}
                    {!recording ? (
                        <motion.button
                            onClick={startRecording}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl dark:bg-white/5 bg-gray-200 dark:border-white/10 border-gray-300 border dark:hover:bg-white/10 hover:bg-gray-300 transition-colors duration-200 shrink-0"
                        >
                            <Mic size={16} className="text-gray-400" />
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={stopRecording}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                            animate={{ boxShadow: ["0 0 0px rgba(220,38,38,0)", "0 0 16px rgba(220,38,38,0.5)", "0 0 0px rgba(220,38,38,0)"] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-600/20 border border-red-600/40 shrink-0"
                        >
                            <MicOff size={16} className="text-red-400" />
                        </motion.button>
                    )}

                    {/* Send button */}
                    <motion.button
                        onClick={sendMessage}
                        whileHover={{ scale: 1.08, boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }}
                        whileTap={{ scale: 0.94 }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors duration-200 shrink-0 shadow-lg shadow-blue-700/20"
                    >
                        <Send size={15} className="text-white" />
                    </motion.button>

                </div>
            </div>
        </div>
    );
}
