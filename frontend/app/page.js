"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setIsClient(true);
    // Générer les positions des particules côté client uniquement
    const particleData = [...Array(6)].map(() => ({
      left: `${20 + Math.random() * 60}%`,
      top: `${20 + Math.random() * 60}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${3 + Math.random() * 2}s`
    }));
    setParticles(particleData);
  }, []);

  const features = [
    {
      icon: "🖥️",
      title: "Monitoring en Temps Réel",
      description: "Surveillez vos machines de mining avec des métriques CPU, mémoire et disque en temps réel."
    },
    {
      icon: "📊",
      title: "Graphiques Historiques", 
      description: "Visualisez l'évolution de vos performances avec des graphiques détaillés sur différentes périodes."
    },
    {
      icon: "⚡",
      title: "Gestion Centralisée",
      description: "Contrôlez toutes vos machines depuis une interface unique avec terminal intégré."
    },
    {
      icon: "🔧",
      title: "Installation Automatique",
      description: "Déployez facilement l'agent MineOps sur vos machines avec l'installateur automatique."
    },
  ];

  return (
    <>
      <div className="relative z-10 min-h-screen">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center mb-20">
            {/* Logo/Title */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                MineOps
              </h1>
              <p className="text-xl md:text-2xl text-white/80 font-light">
                Solution complète de monitoring et gestion pour vos rigs de mining
              </p>
            </div>

            {/* Network Visualization */}
            <div className="glass-card p-8 mb-8 max-w-4xl mx-auto">
              <div className="relative h-52 flex items-center justify-center overflow-hidden">
                {/* Background Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-green-500/10 rounded-xl blur-xl"></div>
                
                {/* Connection Lines with Gradient */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={`line-${i}`}
                    className="absolute origin-center"
                    style={{
                      transform: `rotate(${i * 72}deg)`,
                      width: '100px',
                      height: '2px',
                      background: `linear-gradient(to right, 
                        rgba(59, 130, 246, 0.8), 
                        rgba(147, 51, 234, 0.6), 
                        rgba(34, 197, 94, 0.8))`,
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                      animation: `pulse 2s ease-in-out infinite ${i * 0.2}s`
                    }}
                  />
                ))}

                {/* Central Hub - Enhanced */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur animate-ping"></div>
                    <span className="text-3xl z-10 drop-shadow-lg">💻</span>
                  </div>
                </div>
                
                {/* Connected Mining Rigs - Enhanced */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="absolute z-20"
                    style={{
                      transform: `rotate(${i * 72}deg) translateY(-80px) rotate(-${i * 72}deg)`,
                    }}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
                        <div 
                          className="absolute inset-0 bg-green-400/40 rounded-full blur animate-pulse"
                          style={{ animationDelay: `${i * 0.3}s` }}
                        ></div>
                        <span className="text-lg z-10 drop-shadow-md">⛏️</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Floating Particles - Only render on client */}
                {isClient && particles.map((particle, i) => (
                  <div
                    key={`particle-${i}`}
                    className="absolute w-1 h-1 bg-white/60 rounded-full animate-float"
                    style={{
                      left: particle.left,
                      top: particle.top,
                      animationDelay: particle.animationDelay,
                      animationDuration: particle.animationDuration
                    }}
                  />
                ))}
              </div>
              
              <div className="text-center mt-6">
                <p className="text-lg text-white/90 font-medium mb-2">
                  Une plateforme, toutes vos machines connectées
                </p>
              </div>

              {/* CSS Animations */}
              <style jsx>{`
                @keyframes float {
                  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
                  50% { transform: translateY(-10px) rotate(180deg); opacity: 1; }
                }
                .animate-float {
                  animation: float 4s ease-in-out infinite;
                }
              `}</style>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="glass-button-success px-8 py-4 font-semibold text-lg hover:scale-105 transform transition-all">
                Accéder au Dashboard
              </Link>
              <Link href="/terminal" className="glass-button px-8 py-4 font-semibold text-lg hover:scale-105 transform transition-all">
                Terminal de Commandes
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Fonctionnalités Principales
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                MineOps vous offre tous les outils nécessaires pour surveiller, gérer et optimiser vos opérations de mining
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="glass-card p-6 hover:bg-white/25 transition-all duration-300 hover:scale-105 h-64 flex flex-col">
                  <div className="text-4xl mb-4 text-center">{feature.icon}</div>
                  <h3 className="text-white font-semibold text-xl mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed text-center flex-1">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="py-20 px-4 bg-black/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-8">
              Commencer avec MineOps
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="glass-card p-6">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  1
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Installation</h3>
                <p className="text-white/70">Ajoutez vos machines via le dashboard avec l&apos;installateur automatique</p>
              </div>
              
              <div className="glass-card p-6">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  2
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Monitoring</h3>
                <p className="text-white/70">Surveillez vos métriques en temps réel depuis le dashboard principal</p>
              </div>
              
              <div className="glass-card p-6">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  3
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Gestion</h3>
                <p className="text-white/70">Utilisez le terminal pour exécuter des commandes sur vos machines</p>
              </div>
            </div>

            <Link href="/dashboard" className="glass-button-success px-8 py-4 font-semibold text-lg hover:scale-105 transform transition-all inline-block">
              Démarrer Maintenant →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="py-8 px-4 border-t border-white/20">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-white/50">
              MineOps - Solution de monitoring et gestion pour mining operations
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
