import { useState, useImperativeHandle, forwardRef } from "react";
import { addMiner } from "@/services/install";

const AddMiner = forwardRef((props, ref) => {
    const [showForm, setShowForm] = useState(false);
    const [ip, setIp] = useState("");
    const [user, setUser] = useState("");
    const [pwd, setPwd] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [showWaitingMessage, setShowWaitingMessage] = useState(false);

    // Exposer la fonction pour masquer le message d'attente
    useImperativeHandle(ref, () => ({
        hideWaitingMessage: () => setShowWaitingMessage(false)
    }));

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
                setTimeout(() => {
                    setShowForm(false);
                    setShowWaitingMessage(true);
                    // Nettoyer le formulaire
                    setIp("");
                    setUser("");
                    setPwd("");
                    setSuccess("");
                    setError("");
                }, 2000);
            }
        } catch (err) {
            console.error("Erreur lors de l'installation :", err);
            setError(
                err?.response?.data?.error ||
                err?.message ||
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
            {showWaitingMessage ? (
                <div className="glass-card p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                        <span className="animate-spin h-4 w-4 border-b-2 border-blue-400 rounded-full"></span>
                        <span className="text-sm font-medium">Machine en cours d'ajout...</span>
                    </div>
                    <p className="text-white/70 text-xs">
                        La machine apparaîtra sous peu dans le dashboard
                    </p>
                </div>
            ) : !showForm ? (
                <button
                    className="glass-button font-medium"
                    onClick={() => setShowForm(true)}
                >
                    + Ajouter une machine
                </button>
            ) : (
                <div className="glass-card p-6 w-80">
                    <h3 className="text-white font-semibold text-lg mb-4 text-center">
                        Ajouter une machine
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Adresse IP"
                            value={ip}
                            onChange={e => setIp(e.target.value)}
                            className="glass-input w-full"
                            required
                            disabled={loading}
                        />
                        <input
                            type="text"
                            placeholder="Utilisateur"
                            value={user}
                            onChange={e => setUser(e.target.value)}
                            className="glass-input w-full"
                            required
                            disabled={loading}
                        />
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={pwd}
                            onChange={e => setPwd(e.target.value)}
                            className="glass-input w-full"
                            required
                            disabled={loading}
                        />
                        
                        {loading && (
                            <div className="flex items-center justify-center gap-2 text-blue-400 py-2">
                                <span className="animate-spin h-4 w-4 border-b-2 border-blue-400 rounded-full"></span>
                                <span className="text-sm">Installation en cours...</span>
                            </div>
                        )}
                        
                        {success && (
                            <div className="text-green-400 text-center py-2 font-medium">
                                {success}
                            </div>
                        )}
                        
                        {error && (
                            <div className="text-red-400 text-center py-2 text-sm">
                                {error}
                            </div>
                        )}
                        
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="glass-button-success flex-1 font-medium"
                                disabled={loading}
                            >
                                Valider
                            </button>
                            <button
                                type="button"
                                className="glass-button-danger flex-1 font-medium"
                                onClick={handleCloseForm}
                                disabled={loading}
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
});

AddMiner.displayName = 'AddMiner';

export default AddMiner;