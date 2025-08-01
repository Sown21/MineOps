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
import { withRouter } from "next/router";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const Chart = ({ title, labels, values, color = "#5ca3fa" }) => {
    const data = {
        labels,
        datasets: [
            {
                label: title,
                data: values,
                backgroundColor: color,
                borderColor: "#fff", 
                tension: 0.3,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { 
                display: true,
                labels: { 
                    color: "#fff",
                    boxWidth: 60,
                    boxHeight: 15,
                    font: { size: 16, }
                }
             },
        },
        scales: {
            x: {
                grid: {
                    color: "rgba(255,255,255,0.1)", // couleur de la grille X
                },
                ticks: {
                    color: "#fff", // couleur des labels X
                },
            },
            y: {
                grid: {
                    color: "rgba(255,255,255,0.1)", // couleur de la grille Y
                },
                ticks: {
                    color: "#fff", // couleur des labels Y
                },
                beginAtZero: true,
            },
        },
    };

    return <Line data={data} options={options} />;
}

export default Chart;