"use client"

import { useState, useEffect } from "react";
import Card from "@/components/Card";
import { getLastMetricsByHostname, getMetrics, getAgentHealth } from "@/services/metrics";

const Dashboard = () => {
    const [hostnames, setHostnames] = useState([]);
    const [latestMetrics, setLatestMetrics] = useState({});
    const [healthStatus, setHealthStatus] = useState({});

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // Récupérer tous les hostnames uniques
                const response = await getMetrics();
                const uniqueHostnames = [...new Set(response.data.map(metric => metric.hostname))];
                setHostnames(uniqueHostnames);

                // Récupérer les dernières métriques et le healthcheck pour chaque hostname
                const latestData = {};
                const healthData = {};

                await Promise.all(
                    uniqueHostnames.map(async (hostname) => {
                        const latestResponse = await getLastMetricsByHostname(hostname);
                        latestData[hostname] = latestResponse.data;

                        // Récupérer le healthcheck
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
                console.error("Error fetching metrics:", error);
            }
        };

        fetchMetrics();

        const interval = setInterval(fetchMetrics, 30000);

        return () => clearInterval(interval);
    }, []);

    if (Object.keys(latestMetrics).length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="border border-gray-400 bg-gray-100 rounded-lg px-8 py-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-700">Chargement des métriques...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            <h1>Dashboard</h1>
            <div className="flex flex-wrap justify-center gap-4 items-start">
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