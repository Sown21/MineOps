import Link from "next/link";
import { useState } from "react";
import { rebootDevice } from "@/services/device";

const Card = ({ hostname, metrics, health }) => {
    const isOnline = health?.status === "online";
    const [isRebooting, setIsRebooting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [rebootStatus, setRebootStatus] = useState(null); // null, 'success', 'error'
    const [rebootMessage, setRebootMessage] = useState("");

    const handleRebootClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirm(true);
        setRebootStatus(null); // Reset status
    };

    const confirmReboot = async () => {
        setIsRebooting(true);
        setShowConfirm(false);
        setRebootStatus(null);
        
        try {
            await rebootDevice(metrics?.ip_address);
            // TOUJOURS TRAITER COMME UN SUCCÈS car le reboot fonctionne même avec timeout
            setRebootStatus('success');
            setRebootMessage(`Reboot lancé pour ${hostname}`);
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setRebootStatus(null);
                setRebootMessage("");
                setIsRebooting(false); // RESET APRÈS LE MESSAGE
            }, 3000);
            
        } catch (error) {
            // DIFFÉRENCIER LES ERREURS TIMEOUT DES VRAIES ERREURS
            if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
                // Timeout = reboot probablement réussi (machine redémarre)
                setRebootStatus('success');
                setRebootMessage(`Reboot lancé pour ${hostname} (machine redémarre...)`);
                
                setTimeout(() => {
                    setRebootStatus(null);
                    setRebootMessage("");
                    setIsRebooting(false);
                }, 4000);
            } else {
                // Vraie erreur (SSH, connexion, etc.)
                setRebootStatus('error');
                setRebootMessage(`Erreur lors du reboot: ${error.message}`);
                
                setTimeout(() => {
                    setRebootStatus(null);
                    setRebootMessage("");
                    setIsRebooting(false);
                }, 5000);
            }
        }
    };

    const cancelReboot = () => {
        setShowConfirm(false);
    };

    return (
        <div className="relative">
            <Link href={`/dashboard/${hostname}`}>
                <div className="glass-card p-6 hover:bg-white/25 transition-all duration-200 cursor-pointer group">
                    {/* Message de statut reboot */}
                    {rebootStatus && (
                        <div className={`mb-4 p-2 rounded text-sm text-center ${
                            rebootStatus === 'success' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {rebootMessage}
                        </div>
                    )}

                    {/* Header avec hostname et status */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors duration-200">
                            {hostname}
                        </h3>
                        <div className="relative flex h-6 w-6 items-center justify-center">
                            {isOnline && !isRebooting && ( // NE PAS MONTRER LE PING SI REBOOT EN COURS
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            )}
                            <span
                                title={
                                    isRebooting ? "Machine en cours de redémarrage..." :
                                    isOnline ? "Agent en ligne" : "Hôte injoignable ou agent hors-ligne"
                                }
                                className={`relative inline-flex w-3 h-3 rounded-full border ${
                                    isRebooting ? "bg-yellow-400 border-yellow-500" : // STATUT REBOOT
                                    isOnline ? "status-indicator-online" : "status-indicator-offline"
                                }`}
                            ></span>
                        </div>
                    </div>

                    {/* Séparateur */}
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/60 to-transparent mb-4"></div>

                    {/* Métriques */}
                    <div className="space-y-2 text-white/90 mb-4">
                        <div className="flex justify-between">
                            <span className="text-white/70">IP :</span>
                            <span className="font-medium">{metrics?.ip_address || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Miner :</span>
                            <span className="font-medium">SRB</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">CPU :</span>
                            <span className="font-medium">{metrics?.cpu_utilization ?? "-"}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Mémoire :</span>
                            <span className={`font-medium ${metrics.memory_utilization > 90 ? "text-red-600" : "text-white/70"}`}>{metrics?.memory_utilization ?? "-"}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Disque :</span>
                            <span className={`font-medium ${metrics.disk_usage > 90 ? "text-red-600" : "text-white/70"}`}>{metrics?.disk_usage ?? "-"}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Uptime :</span>
                            <span className="font-medium">{isOnline ? (metrics?.uptime ?? "-") : "Off"}</span>
                        </div>
                    </div>

                    {/* Bouton reboot en bas à gauche */}
                    <div className="flex justify-start">
                        <button
                            onClick={handleRebootClick}
                            disabled={!isOnline || isRebooting}
                            className={`glass-button text-sm px-3 py-2 ${
                                !isOnline || isRebooting
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-red-500/20 hover:border-red-400"
                            }`}
                            title={
                                isRebooting ? "Redémarrage en cours..." :
                                !isOnline ? "Machine hors ligne" : "Redémarrer la machine"
                            }
                        >
                            {isRebooting ? "🔄 Redémarrage..." : "Redémarrer"}
                        </button>
                    </div>
                </div>
            </Link>

            {/* Modal de confirmation - ne s'affiche que si showConfirm = true */}
            {showConfirm && !isRebooting && ( // NE PAS AFFICHER SI REBOOT DÉJÀ EN COURS
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="glass-card p-6 max-w-md mx-4">
                        <h3 className="text-white font-semibold text-lg mb-4">
                            Confirmer le redémarrage
                        </h3>
                        <p className="text-white/70 mb-6">
                            Êtes-vous sûr de vouloir redémarrer <strong className="text-white">{hostname}</strong> ?
                            <br />
                            <span className="text-sm">IP: {metrics?.ip_address}</span>
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelReboot}
                                className="glass-button px-4 py-2"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmReboot}
                                className="glass-button px-4 py-2 hover:bg-red-500/20 hover:border-red-400"
                            >
                                Redémarrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Card;