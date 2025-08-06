"use client"
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const Chart = ({ title, labels, values, color = "#5ca3fa", maxPoints = 72, period = "6h" }) => {
    const limitedLabels = labels.slice(-maxPoints);
    const limitedValues = values.slice(-maxPoints);
    
    const data = {
        labels: limitedLabels,
        datasets: [
            {
                label: title,
                data: limitedValues,
                backgroundColor: color,
                borderColor: "#fff", 
                tension: 0.4,
                fill: true,
                pointRadius: 2,
                pointHoverRadius: 4
            }
        ]
    };

    // Calculer combien de labels afficher selon la période
    const getTicksCount = (period) => {
        switch(period) {
            case "1h": return 6;   // Toutes les 10 minutes
            case "6h": return 8;   // Toutes les 45 minutes environ
            case "12h": return 10; // Toutes les 1h15 environ
            case "24h": return 12; // Toutes les 2h
            default: return 8;
        }
    };

    const options = {
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
                grid: {
                    color: "rgba(255,255,255,0.1)",
                },
                ticks: {
                    color: "#fff",
                    maxTicksLimit: getTicksCount(period),
                    // Supprimer le callback personnalisé et laisser Chart.js gérer automatiquement
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
    };

    return (
        <div style={{ height: '300px' }}>
            <Line data={data} options={options} />
        </div>
    );
}

export default Chart;