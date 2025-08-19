'use client';

import { useState, useEffect, useRef } from 'react';
import { createSSHSession, closeSSHSession } from '@/services/commands';
import Convert from 'ansi-to-html';
import stripAnsi from 'strip-ansi';

const InteractiveSSHTerminal = ({ hostname, ipAddress, onClose }) => {
    const [sessionId, setSessionId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [terminalHistory, setTerminalHistory] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [currentCommand, setCurrentCommand] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const terminalRef = useRef(null);
    const wsRef = useRef(null);
    const inputRef = useRef(null);
    
    // Configurateur ANSI to HTML
    const convert = new Convert({
        fg: '#00ff00',
        bg: '#000000',
        newline: false,
        escapeXML: false,
        stream: false
    });

    // Créer la session SSH au montage
    useEffect(() => {
        const initSession = async () => {
            try {
                setIsLoading(true);
                console.log('🚀 Création session SSH...');
                
                const session = await createSSHSession(hostname, ipAddress);
                console.log('✅ Session créée:', session);
                setSessionId(session.session_id);
                
                // Attendre un peu que la session soit prête côté backend
                setTimeout(() => {
                    // Établir la connexion WebSocket avec URL dynamique
                    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                    const host = window.location.hostname;
                    const port = '8000'; // Port backend
                    const wsUrl = `${protocol}//${host}:${port}/ssh/ws/${session.session_id}`;
                    console.log('🔌 Connexion WebSocket:', wsUrl);
                    
                    const ws = new WebSocket(wsUrl);
                    
                    ws.onopen = () => {
                        console.log('✅ WebSocket connecté');
                        setIsConnected(true);
                        setConnectionError(null);
                        setIsLoading(false);
                    };
                    
                    ws.onmessage = (event) => {
                        console.log('📨 Message reçu:', event.data);
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'output') {
                                // Traiter les séquences ANSI
                                let processedData = data.data;
                                
                                // Option 1: Convertir ANSI en HTML (pour les couleurs)
                                // processedData = convert.toHtml(data.data);
                                
                                // Option 2: Nettoyer les codes ANSI (plus simple)
                                processedData = stripAnsi(data.data);
                                
                                setTerminalHistory(prev => prev + processedData);
                            } else if (data.type === 'error') {
                                setConnectionError(data.message);
                                setIsLoading(false);
                            }
                        } catch (e) {
                            // Message texte simple - nettoyer les codes ANSI
                            const cleanData = stripAnsi(event.data);
                            setTerminalHistory(prev => prev + cleanData);
                        }
                    };
                    
                    ws.onclose = (event) => {
                        console.log('❌ WebSocket fermé:', event.code, event.reason);
                        setIsConnected(false);
                        setIsLoading(false);
                    };
                    
                    ws.onerror = (error) => {
                        console.error('❌ Erreur WebSocket:', error);
                        setConnectionError('Erreur de connexion WebSocket');
                        setIsLoading(false);
                    };
                    
                    wsRef.current = ws;
                }, 1000); // Attendre 1 seconde
                
            } catch (error) {
                console.error('❌ Erreur création session:', error);
                setConnectionError(error.response?.data?.detail || 'Erreur de connexion SSH');
                setIsLoading(false);
            }
        };

        initSession();
        
        // Cleanup au démontage
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [hostname, ipAddress]);

    // Auto-scroll
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalHistory]);

    // Focus sur l'input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputRef.current && isConnected) {
                inputRef.current.focus();
            }
        }, 500);
        
        return () => clearTimeout(timer);
    }, [isConnected]);

    const sendCommand = (command) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log('📤 Envoi commande:', command);
            wsRef.current.send(JSON.stringify({
                type: 'input',
                data: command
            }));
        } else {
            console.log('❌ WebSocket non prêt:', wsRef.current?.readyState);
        }
    };

    const handleCommandSubmit = () => {
        if (currentCommand.trim() && isConnected) {
            // Ajouter à l'historique
            if (currentCommand.trim() !== '') {
                setCommandHistory(prev => {
                    const newHistory = [...prev, currentCommand.trim()];
                    return newHistory.slice(-50); // Garder les 50 dernières
                });
            }
            
            // Envoyer la commande
            sendCommand(currentCommand + '\r');
            setCurrentCommand('');
            setHistoryIndex(-1);
        }
    };

    const handleKeyPress = (e) => {
        if (!isConnected || wsRef.current?.readyState !== WebSocket.OPEN) return;
        
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommandSubmit();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCurrentCommand('');
            }
        }
    };

    const handleClose = async () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        
        if (sessionId) {
            try {
                await closeSSHSession(sessionId);
                console.log('✅ Session fermée');
            } catch (error) {
                console.error('❌ Erreur fermeture session:', error);
            }
        }
        
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 w-full max-w-6xl h-[90vh] flex flex-col rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                            isLoading ? 'bg-yellow-500' : 
                            isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-white font-medium">
                            SSH Terminal - {hostname} ({ipAddress})
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/70 hover:text-white text-xl"
                    >
                        ✕
                    </button>
                </div>

                {connectionError ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-red-400 text-lg mb-2">❌ {connectionError}</div>
                            <button 
                                onClick={handleClose}
                                className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Terminal Output */}
                        <div
                            ref={terminalRef}
                            className="flex-1 p-4 bg-black text-green-400 font-mono text-sm overflow-y-auto whitespace-pre-wrap"
                            style={{ fontFamily: 'Consolas, "Courier New", monospace' }}
                        >
                            {isLoading && 'Connexion SSH en cours...\n'}
                            {terminalHistory}
                            {isConnected && !terminalHistory && 'Terminal prêt - tapez vos commandes...\n'}
                        </div>

                        {/* Command Input Zone */}
                        <div className="p-4 bg-black border-t border-gray-700">
                            <div className="flex items-center bg-gray-900 rounded px-3 py-2">
                                <span className="text-green-400 font-mono mr-2">$</span>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={currentCommand}
                                    onChange={(e) => setCurrentCommand(e.target.value)}
                                    className="flex-1 bg-transparent text-green-400 font-mono outline-none"
                                    placeholder={isConnected ? "Tapez votre commande..." : "Terminal non connecté"}
                                    onKeyDown={handleKeyPress}
                                    disabled={!isConnected}
                                    autoComplete="off"
                                    style={{ fontFamily: 'Consolas, "Courier New", monospace' }}
                                />
                                <button
                                    onClick={handleCommandSubmit}
                                    disabled={!isConnected || !currentCommand.trim()}
                                    className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    Envoyer
                                </button>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                Appuyez sur Entrée pour exécuter • ↑↓ pour l'historique des commandes
                                {commandHistory.length > 0 && ` • ${commandHistory.length} commandes mémorisées`}
                            </div>
                        </div>
                        
                        {/* Status bar */}
                        <div className="bg-gray-800 px-4 py-2 text-sm text-gray-400 border-t border-gray-700">
                            {isLoading ? (
                                <span className="text-yellow-400">⏳ Connexion en cours...</span>
                            ) : isConnected ? (
                                <span className="text-green-400">● Connecté - Tapez vos commandes directement</span>
                            ) : (
                                <span className="text-red-400">● Déconnecté</span>
                            )}
                            <span className="float-right">
                                Session: {sessionId?.substring(0, 8)}... | WebSocket: {
                                    wsRef.current?.readyState === WebSocket.OPEN ? 'Ouvert' :
                                    wsRef.current?.readyState === WebSocket.CONNECTING ? 'Connexion...' :
                                    'Fermé'
                                }
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default InteractiveSSHTerminal;