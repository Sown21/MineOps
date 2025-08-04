import { useState } from "react";
import { addMiner } from "@/services/install";

const AddMiner = () => {
    const [showForm, setShowForm] = useState(false);
    const [ip, setIp] = useState("");
    const [user, setUser] = useState("");
    const [pwd, setPwd] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess("");
        setError("");
        try {
            const res = await addMiner(ip, user, pwd);
            if (res.data.error) {
                setError(res.data.error);
            } else {
                setSuccess("Installation réussie !");
                setShowForm(false);
            }
        } catch (err) {
            console.error("Erreur lors de l'installation :", err);
            setError(
                err?.response?.data?.error ||
                err?.message ||
                JSON.stringify(err) ||
                "Erreur lors de l'installation."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setIp("");
        setUser("");
        setPwd("");
        setSuccess("");
        setError("");
    };

    return (
        <div className="flex flex-col items-center">
            {!showForm ? (
                <button
                    className="border border-white/40 rounded-xl p-2 bg-white/30 hover:bg-white/40 text-white"
                    onClick={() => setShowForm(true)}
                >
                    Ajouter une machine
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-80">
                    <input
                        type="text"
                        placeholder="Adresse IP"
                        value={ip}
                        onChange={e => setIp(e.target.value)}
                        className="p-2 rounded bg-white/20 text-white border border-white/40"
                        required
                        disabled={loading}
                    />
                    <input
                        type="text"
                        placeholder="Utilisateur"
                        value={user}
                        onChange={e => setUser(e.target.value)}
                        className="p-2 rounded bg-white/20 text-white border border-white/40"
                        required
                        disabled={loading}
                    />
                    <input
                        type="text"
                        placeholder="Mot de passe"
                        value={pwd}
                        onChange={e => setPwd(e.target.value)}
                        className="p-2 rounded bg-white/20 text-white border border-white/40"
                        required
                        disabled={loading}
                    />
                    {loading && (
                        <div className="flex items-center gap-2 text-blue-500">
                            <span className="animate-spin h-5 w-5 border-b-2 border-blue-500 rounded-full inline-block"></span>
                            Installation en cours...
                        </div>
                    )}
                    {success && <p className="text-green-500">{succes}</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="border border-white/40 rounded-xl p-2 bg-white/30 hover:bg-white/40 text-white"
                            disabled={loading}
                        >
                            Valider
                        </button>
                        <button
                            type="button"
                            className="border border-red-400 rounded-xl p-2 bg-red-300 hover:bg-red-400 text-white"
                            onClick={handleCloseForm}
                            disabled={loading}
                        >
                            Retour
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AddMiner;