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
    const [selectedPeriod, setSelectedPeriod] = useState("6h");
    const [error, setError] = useState(null);

    const isOnline = health?.status === "online";

    // Fonction helper pour déterminer le nombre de points selon la période
    const getMaxPointsForPeriod = (period) => {
        const map = {
            "1h": 12,   // 1 point toutes les 5 minutes
            "6h": 72,   // 1 point toutes les 5 minutes
            "12h": 144, // 1 point toutes les 5 minutes
            "24h": 288  // 1 point toutes les 5 minutes
        };
        return map[period] || 72;
    };

    // Fonction pour générer des labels temporels corrects
    const generateTimeLabels = (history, period) => {
        if (!history || history.length === 0) return [];
        
        return history.map(h => {
            const date = new Date(h.last_seen);
            
            // Format différent selon la période
            switch(period) {
                case "1h":
                    return date.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                case "6h":
                case "12h":
                    return date.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                case "24h":
                    return date.toLocaleString('fr-FR', { 
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                default:
                    return date.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
            }
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(null);
                
                // Récupérer les métriques actuelles
                const metricsRes = await getLastMetricsByHostname(hostname);
                setMetrics(metricsRes.data);
                
                // Récupérer l'historique avec gestion d'erreur spécifique
                try {
                    const historyRes = await getHostnameHistory(hostname, selectedPeriod);
                    const historyData = historyRes.data;
                    if (Array.isArray(historyData)) {
                        setHistory(historyData);
                    } else if (historyData && Array.isArray(historyData.metrics)) {
                        setHistory(historyData.metrics);
                    } else {
                        setHistory([]);
                    }
                } catch (historyError) {
                    console.warn("Erreur historique:", historyError);
                    if (historyError.response?.status === 404 || historyError.response?.data?.detail?.includes("Aucune métrique trouvée")) {
                        setError(`Aucune métrique récente pour ${hostname}.`);
                    } else {
                        setError(`Erreur lors du chargement de l'historique: ${historyError.message}`);
                    }
                    setHistory([]);
                }

                // Récupérer la santé de l'agent
                try {
                    const healthRes = await getAgentHealth(hostname);
                    setHealth(healthRes.data);
                } catch (e) {
                    setHealth({ status: "offline" });
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                if (error.response?.status === 404) {
                    setError(`Aucune métrique trouvée pour ${hostname}`);
                } else {
                    setError(`Erreur de connexion: ${error.message}`);
                }
                setHistory([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        const interval = setInterval(fetchData, 30000);

        return () => clearInterval(interval);
    }, [hostname, selectedPeriod]);

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

    // Vérifier que history est un tableau avant de faire map
    if (!Array.isArray(history) || history.length === 0) {
        return (
            <div className="px-4">
                <div className="glass-card p-6 mb-8">
                    <Link className="glass-button" href="/dashboard">
                        ← Retour au dashboard
                    </Link>
                    <h1 className="text-white font-bold text-2xl md:text-3xl mt-4">
                        Dashboard - {hostname}
                    </h1>
                </div>
                
                {error && (
                    <div className="glass-card p-4 mb-6 border-l-4 border-red-500 text-center">
                        <p className="text-red-400 font-medium">Erreur de chargement</p>
                        <p className="text-white/70 text-sm">{error}</p>
                    </div>
                )}
                
                {/* <div className="glass-card p-6 text-center">
                    <p className="text-white/90">Aucune donnée d&apos;historique disponible pour {hostname}</p>
                </div> */}
            </div>
        );
    }

    // Remplacer la génération des labels
    const labels = generateTimeLabels(history, selectedPeriod);
    
    const cpuValues = history.map(h => h.cpu_utilization || 0);
    const memoryValues = history.map(h => h.memory_utilization || 0);
    const diskValues = history.map(h => h.disk_usage || 0);

    return (
        <div className="px-4">
            {/* Header avec contrôles */}
            <div className="glass-card p-6 mb-8">
                <div className="flex flex-col gap-4">
                    {/* Première ligne */}
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
                    
                    {/* Deuxième ligne - Contrôles */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {/* Sélecteur de période */}
                        <div className="flex gap-2">
                            {["1h", "6h", "12h", "24h"].map(period => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                        selectedPeriod === period
                                            ? "bg-blue-500 text-white"
                                            : "bg-white/10 text-white/70 hover:bg-white/20"
                                    }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Afficher l'erreur si nécessaire */}
            {error && (
                <div className="glass-card p-4 mb-6 border-l-4 border-red-500">
                    <p className="text-red-400 font-medium">Erreur de chargement</p>
                    <p className="text-white/70 text-sm">{error}</p>
                </div>
            )}

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

            {/* Graphiques avec période passée en prop */}
            <div className="glass-card p-4 mb-6">
                <h2 className="text-white font-semibold text-xl mb-4">
                    Historique des métriques - {selectedPeriod} 
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="glass-card p-4">
                        <Chart 
                            title="CPU (%)" 
                            labels={labels} 
                            values={cpuValues} 
                            color="#5ca3fa" 
                            maxPoints={getMaxPointsForPeriod(selectedPeriod)}
                            period={selectedPeriod}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { 
                                        display: true,
                                        labels: { 
                                            color: "#fff",
                                            boxWidth: 60,
                                            boxHeight: 15,
                                            font: { size: 14 }
                                        }
                                     },
                                },
                                scales: {
                                    x: {
                                        type: 'time',
                                        time: {
                                            unit: selectedPeriod === '24h' ? 'hour' : 'minute',
                                            displayFormats: {
                                                minute: 'HH:mm',
                                                hour: 'HH:mm'
                                            }
                                        },
                                        grid: {
                                            color: "rgba(255,255,255,0.1)",
                                        },
                                        ticks: {
                                            color: "#fff",
                                            maxTicksLimit: 8,
                                        },
                                    },
                                    y: {
                                        grid: {
                                            color: "rgba(255,255,255,0.1)",
                                        },
                                        ticks: {
                                            color: "#fff",
                                        },
                                        beginAtZero: true,
                                    },
                                },
                            }}
                        />
                    </div>
                    <div className="glass-card p-4">
                        <Chart 
                            title="Mémoire (%)" 
                            labels={labels} 
                            values={memoryValues} 
                            color="#76f871" 
                            maxPoints={getMaxPointsForPeriod(selectedPeriod)}
                            period={selectedPeriod}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { 
                                        display: true,
                                        labels: { 
                                            color: "#fff",
                                            boxWidth: 60,
                                            boxHeight: 15,
                                            font: { size: 14 }
                                        }
                                     },
                                },
                                scales: {
                                    x: {
                                        type: 'time',
                                        time: {
                                            unit: selectedPeriod === '24h' ? 'hour' : 'minute',
                                            displayFormats: {
                                                minute: 'HH:mm',
                                                hour: 'HH:mm'
                                            }
                                        },
                                        grid: {
                                            color: "rgba(255,255,255,0.1)",
                                        },
                                        ticks: {
                                            color: "#fff",
                                            maxTicksLimit: 8,
                                        },
                                    },
                                    y: {
                                        grid: {
                                            color: "rgba(255,255,255,0.1)",
                                        },
                                        ticks: {
                                            color: "#fff",
                                        },
                                        beginAtZero: true,
                                    },
                                },
                            }}
                        />
                    </div>
                    <div className="glass-card p-4">
                        <Chart 
                            title="Disque (%)" 
                            labels={labels} 
                            values={diskValues} 
                            color="#f59e0b" 
                            maxPoints={getMaxPointsForPeriod(selectedPeriod)}
                            period={selectedPeriod}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { 
                                        display: true,
                                        labels: { 
                                            color: "#fff",
                                            boxWidth: 60,
                                            boxHeight: 15,
                                            font: { size: 14 }
                                        }
                                     },
                                },
                                scales: {
                                    x: {
                                        type: 'time',
                                        time: {
                                            unit: selectedPeriod === '24h' ? 'hour' : 'minute',
                                            displayFormats: {
                                                minute: 'HH:mm',
                                                hour: 'HH:mm'
                                            }
                                        },
                                        grid: {
                                            color: "rgba(255,255,255,0.1)",
                                        },
                                        ticks: {
                                            color: "#fff",
                                            maxTicksLimit: 8,
                                        },
                                    },
                                    y: {
                                        grid: {
                                            color: "rgba(255,255,255,0.1)",
                                        },
                                        ticks: {
                                            color: "#fff",
                                        },
                                        beginAtZero: true,
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}