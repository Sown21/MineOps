"use client";

import { useState, useEffect, useRef } from "react";
import Card from "@/components/Card";
import { getLastMetricsByHostname, getMetrics, getAgentHealth } from "@/services/metrics";
import AddMiner from "@/components/AddMiner";

const Dashboard = () => {
    const [hostnames, setHostnames] = useState([]);
    const [latestMetrics, setLatestMetrics] = useState({});
    const [healthStatus, setHealthStatus] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const previousHostnamesCount = useRef(0);
    const addMinerRef = useRef();

    const upCount = Object.values(healthStatus).filter(h => h.status === "online").length;
    const totalCount = hostnames.length;

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await getMetrics();
                const uniqueHostnames = [...new Set(response.data.map(metric => metric.hostname))];
                
                // Détecter si une nouvelle machine a été ajoutée
                if (previousHostnamesCount.current > 0 && uniqueHostnames.length > previousHostnamesCount.current) {
                    // Une nouvelle machine a été détectée, masquer le message d'attente
                    if (addMinerRef.current?.hideWaitingMessage) {
                        addMinerRef.current.hideWaitingMessage();
                    }
                }
                previousHostnamesCount.current = uniqueHostnames.length;
                
                setHostnames(uniqueHostnames);

                const latestData = {};
                const healthData = {};

                await Promise.all(
                    uniqueHostnames.map(async (hostname) => {
                        const latestResponse = await getLastMetricsByHostname(hostname);
                        latestData[hostname] = latestResponse.data;

                        try {
                            const healthResponse = await getAgentHealth(hostname);
                            healthData[hostname] = healthResponse.data;
                        } catch (e) {
                            healthData[hostname] = { status: "offline" };
                        }
                    })
                );
                setLatestMetrics(latestData);
                setHealthStatus(healthData);

            } catch (error) {
                if (error.response?.status === 404) {
                    setHostnames([]);
                } else {
                    console.error("Error fetching metrics:", error);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="glass-card px-8 py-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-white/90">Chargement des métriques...</p>
                </div>
            </div>
        );
    }

    if (hostnames.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="glass-card px-8 py-6 text-center">
                    <p className="text-white/90 text-lg mb-4">Aucune machine détectée</p>
                    <p className="text-white/70 mb-6">Veuillez ajouter une machine pour commencer</p>
                    <AddMiner ref={addMinerRef} />
                </div>
            </div>
        );
    }

    return (
        <div className="px-4">
            {/* Header avec actions */}
            <div className="glass-card p-6 mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-white font-bold text-3xl md:text-4xl text-center md:text-left">
                        Dashboard
                    </h1>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <AddMiner ref={addMinerRef} />
                        
                        <div className={`px-6 py-3 border rounded-xl backdrop-blur-md bg-white/20 ${
                            upCount < totalCount ? "border-red-400" : "border-green-400"
                        }`}>
                            <span className={`font-semibold ${
                                upCount < totalCount ? "text-red-400" : "text-green-400"
                            }`}>
                                Machines UP: {upCount}/{totalCount}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grille des cartes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {hostnames.map(hostname => (
                    <Card 
                        key={hostname}
                        hostname={hostname}
                        metrics={latestMetrics[hostname]}
                        health={healthStatus[hostname]}
                    />
                ))}
            </div>
        </div>
    )
}

export default Dashboard;