// components/Footer.jsx
export default function Footer() {
    return (
        <footer className="w-full mt-20 border-t border-white/10 bg-black/40 backdrop-blur text-center py-6 text-gray-400 text-sm">

            <p>
                © {new Date().getFullYear()} <span className="text-white font-semibold">Wasali</span>.
                Tous droits réservés.
            </p>

        </footer>
    );
}