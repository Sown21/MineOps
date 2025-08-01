import Link from "next/link";

const Card = ({hostname, metrics, health}) => {
    const isOnline = health?.status === "online";
    return (
        <Link href={`/dashboard/${hostname}`} className="no-underline">
            <div className="cursor-pointer backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 px-8 py-6 w-80 m-4 relative">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-xl text-white drop-shadow">{hostname}</h2>
                    <span className="relative flex h-6 w-6 items-center justify-center">
                        {isOnline && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        )}
                        {!isOnline && (
                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-0"></span>
                        )}
                        <span
                            title={isOnline ? "Agent en ligne" : "Hôte injoignable ou agent hors-ligne"}
                            className={`relative inline-flex w-3 h-3 rounded-full border ${
                                isOnline
                                    ? "bg-green-500 border-white shadow-[0_0_8px_2px_rgba(34,197,94,0.7)]"
                                    : "bg-red-500 border-red-300 shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]"
                            }`}
                        ></span>
                    </span>
                </div>
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/60 to-transparent mb-4"></div>
                <div className="flex flex-col gap-2 text-base text-white/90">
                    <p><span className="font-semibold">IP :</span> {metrics?.ip_address || "-"}</p>
                    <p><span className="font-semibold">Miner :</span> SRB</p>
                    <p><span className="font-semibold">CPU :</span> {metrics?.cpu_utilization ?? "-"}%</p>
                    <p><span className="font-semibold">Mémoire :</span> {metrics?.memory_utilization ?? "-"}%</p>
                    <p><span className="font-semibold">Disque :</span> {metrics?.disk_usage ?? "-"}%</p>
                    <p className="text-xs text-white/70">{metrics?.last_seen || ""}</p>
                </div>
            </div>
        </Link>
    )
}

export default Card;