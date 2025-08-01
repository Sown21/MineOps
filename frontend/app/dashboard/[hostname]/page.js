"use client"

import { useEffect, useState } from "react";
import { getLastMetricsByHostname, getAgentHealth } from "@/services/metrics";
import Link from "next/link";
import { useParams } from "next/navigation";
import Chart from "@/components/Chart";
import { getHostnameHistory } from "@/services/metrics";

export default function HostnameDashboard() {
    const params = useParams();
    const hostname = params.hostname;

    const [metrics, setMetrics] = useState(null);
    const [health, setHealth] = useState(null);

    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!hostname) return;
        getLastMetricsByHostname(hostname).then(res => setMetrics(res.data));
        getAgentHealth(hostname).then(res => setHealth(res.data));
        getHostnameHistory(hostname).then(res => setHistory(res.data));
    }, [hostname]);

    if (!metrics || !health || !history.length) {
        return <div>Chargement...</div>;
    }

    const isOnline = health.status === "online";
    const labels = history.map(m => new Date(m.last_seen).toLocaleTimeString()).reverse();
    const memValues = history.map(m => m.memory_utilization).reverse();
    const cpuValues = history.map(m => m.cpu_utilization).reverse();

    return (
        <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl shadow-xl px-8 py-6 m-4">
            <Link className="border border-white/40 rounded-xl p-2 bg-white/30 hover:bg-white/40 text-white" href="/dashboard">← Retour au tableau de bord</Link>
            <div className="flex items-center justify-center gap-4">
                <h1 className="text-white font-semibold text-2xl">Dashboard pour {hostname}</h1>
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
            <div className="flex flex-col md:flex-row gap-2 text-base text-white/90 items-start">
                {/* <div className="flex flex-col gap-2 border border-2 border-white/60 bg-white/20 p-4 rounded-lg min-w-[180px] max-w-xs w-full md:w-auto">
                    <p className="text-xl"><span className="font-semibold">IP :</span> {metrics?.ip_address || "-"}</p>
                    <p className="text-xl"><span className="font-semibold">Miner :</span> SRB</p>
                    <p className="text-xl"><span className="font-semibold">CPU :</span> {metrics?.cpu_utilization ?? "-"}%</p>
                    <p className="text-xl"><span className="font-semibold">Mémoire :</span> {metrics?.memory_utilization ?? "-"}%</p>
                    <p className="text-xl"><span className="font-semibold">Disque :</span> {metrics?.disk_usage ?? "-"}%</p>
                    <p className="text-xs text-white/70">{metrics?.last_seen || ""}</p>
                    <p className="text-xs text-white/70">Statut : {health?.status || "-"}</p>
                </div> */}
                <div className="backdrop-blur-2xl bg-black/40 grid grid-cols-1 md:grid-cols-2 gap-4 border border-2 border-white/60 flex-1 p-4 rounded-lg w-full mt-8">
                    <h2 className="mt-4 font-semibold text-lg text-center col-span-1 md:col-span-2">Hardware Infos</h2>
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/60 to-transparent mb-4 mt-4 text-center col-span-2"></div>
                    <div className="w-full">
                        <Chart title="Mémoire (%)" labels={labels} values={memValues} color="#5ca3fa" />
                    </div>
                    <div className="w-full">
                        <Chart title="CPU (%)" labels={labels} values={cpuValues} color="#f87171" />
                    </div>
                    <div className="w-full">
                        <Chart title="Disque (%)" labels={labels} values={cpuValues} color="#76f871ff" />
                    </div>
                </div>
            </div>
        </div>
    );
}