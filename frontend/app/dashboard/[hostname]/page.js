"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Chart from "@/components/Chart";
import { getHostnameHistory, getLastMetricsByHostname, getAgentHealth } from "@/services/metrics";

export default function HostnameDashboard() {
    const { hostname } = useParams();
    const [metrics, setMetrics] = useState(null);
    const [health, setHealth] = useState(null);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const isOnline = health?.status === "online";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, historyRes] = await Promise.all([
                    getLastMetricsByHostname(hostname),
                    getHostnameHistory(hostname)
                ]);

                setMetrics(metricsRes.data);
                setHistory(historyRes.data);

                try {
                    const healthRes = await getAgentHealth(hostname);
                    setHealth(healthRes.data);
                } catch (e) {
                    setHealth({ status: "offline" });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [hostname]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="glass-card px-8 py-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-white/90">Chargement des données...</p>
                </div>
            </div>
        );
    }

    const labels = history.map(h => new Date(h.timestamp).toLocaleTimeString());
    const cpuValues = history.map(h => h.cpu_utilization);
    const memoryValues = history.map(h => h.memory_utilization);
    const diskValues = history.map(h => h.disk_usage);

    return (
        <div className="px-4">
            {/* Header */}
            <div className="glass-card p-6 mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <Link className="glass-button" href="/dashboard">
                        ← Retour au dashboard
                    </Link>
                    
                    <div className="flex items-center gap-4">
                        <h1 className="text-white font-bold text-2xl md:text-3xl">
                            Dashboard - {hostname}
                        </h1>
                        <div className="relative flex h-8 w-8 items-center justify-center">
                            {isOnline && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            )}
                            <span
                                title={isOnline ? "Agent en ligne" : "Hôte injoignable ou agent hors-ligne"}
                                className={`relative inline-flex w-4 h-4 rounded-full border ${
                                    isOnline ? "status-indicator-online" : "status-indicator-offline"
                                }`}
                            ></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Métriques actuelles */}
            <div className="glass-card p-6 mb-8">
                <h2 className="text-white font-semibold text-xl mb-4">Métriques actuelles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-white/70 text-sm">IP</p>
                        <p className="text-white font-semibold text-lg">{metrics?.ip_address || "-"}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-white/70 text-sm">Miner</p>
                        <p className="text-white font-semibold text-lg">SRB</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-white/70 text-sm">CPU</p>
                        <p className="text-white font-semibold text-lg">{metrics?.cpu_utilization ?? "-"}%</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-white/70 text-sm">Mémoire</p>
                        <p className="text-white font-semibold text-lg">{metrics?.memory_utilization ?? "-"}%</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-white/70 text-sm">Disque</p>
                        <p className="text-white font-semibold text-lg">{metrics?.disk_usage ?? "-"}%</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-white/70 text-sm">Statut</p>
                        <p className={`font-semibold text-lg ${isOnline ? "text-green-400" : "text-red-400"}`}>
                            {health?.status || "-"}
                        </p>
                    </div>
                </div>
                {metrics?.last_seen && (
                    <p className="text-white/60 text-sm mt-4 text-center">
                        Dernière mise à jour : {metrics.last_seen}
                    </p>
                )}
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                    <Chart title="CPU (%)" labels={labels} values={cpuValues} color="#5ca3fa" />
                </div>
                <div className="glass-card p-6">
                    <Chart title="Mémoire (%)" labels={labels} values={memoryValues} color="#76f871" />
                </div>
                <div className="glass-card p-6">
                    <Chart title="Disque (%)" labels={labels} values={diskValues} color="#f59e0b" />
                </div>
            </div>
        </div>
    );
}