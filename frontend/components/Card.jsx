import Link from "next/link";

const Card = ({ hostname, metrics, health }) => {
    const isOnline = health?.status === "online";

    return (
        <Link href={`/dashboard/${hostname}`}>
            <div className="glass-card p-6 hover:bg-white/25 transition-all duration-200 cursor-pointer group">
                {/* Header avec hostname et status */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors duration-200">
                        {hostname}
                    </h3>
                    <div className="relative flex h-6 w-6 items-center justify-center">
                        {isOnline && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        )}
                        <span
                            title={isOnline ? "Agent en ligne" : "Hôte injoignable ou agent hors-ligne"}
                            className={`relative inline-flex w-3 h-3 rounded-full border ${
                                isOnline ? "status-indicator-online" : "status-indicator-offline"
                            }`}
                        ></span>
                    </div>
                </div>

                {/* Séparateur */}
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/60 to-transparent mb-4"></div>

                {/* Métriques */}
                <div className="space-y-2 text-white/90">
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
                        <span className="font-medium">{metrics?.memory_utilization ?? "-"}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/70">Disque :</span>
                        <span className="font-medium">{metrics?.disk_usage ?? "-"}%</span>
                    </div>
                </div>

                {/* Footer avec timestamp */}
                {metrics?.last_seen && (
                    <div className="mt-4 pt-3 border-t border-white/20">
                        <p className="text-xs text-white/60 text-center">
                            {metrics.last_seen}
                        </p>
                    </div>
                )}
            </div>
        </Link>
    )
}

export default Card;