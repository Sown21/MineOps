import instance from "@/lib/axios";

// Récupérer les métriques
export const getMetrics = () => instance.get("/metrics");

// Récupérer par hostname
export const getMetricsByHostname = (hostname) =>
    instance.get(`/metrics/hostname/${hostname}`);

// Récupérer les dernières métrique du hostname
export const getLastMetricsByHostname = (hostname) => 
    instance.get(`/metrics/latest/${hostname}`);

// Récupérer la santé d'un agent
export const getAgentHealth = (hostname) =>
    instance.get(`/healthcheck/${hostname}`);