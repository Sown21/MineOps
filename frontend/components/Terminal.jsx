"use client";

import { useState, useRef, useEffect } from "react";

const Terminal = ({ 
    output, 
    onCommandExecute, 
    isExecuting, 
    selectedMachinesCount,
    className = ""
}) => {
    const [command, setCommand] = useState("");
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const outputRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll vers le bas
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (command.trim() && !isExecuting) {
            setCommandHistory(prev => [...prev, command]);
            setHistoryIndex(-1);
            onCommandExecute(command);
            setCommand("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCommand("");
            }
        }
    };

    const clearTerminal = () => {

    };

    return (
        <div className="h-160 flex-1 glass-card m-4 flex flex-col">
            {/* Header du terminal */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
                <h2 className="text-white font-bold text-xl">Terminal</h2>
                <div className="flex items-center space-x-4">
                    <span className="text-white/70 text-sm">
                        {selectedMachinesCount} machine{selectedMachinesCount > 1 ? 's' : ''} sélectionnée{selectedMachinesCount > 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={clearTerminal}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Zone de sortie */}
            <div
                ref={outputRef}
                className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-black/20"
            >
                {output.map((line, index) => (
                    <div key={index} className={`mb-2 ${getOutputClass(line.type)}`}>
                        {line.machine && (
                            <span className="text-blue-400">[{line.machine}] </span>
                        )}
                        {/* Utiliser pre pour préserver les retours à la ligne */}
                        <pre className="whitespace-pre-wrap inline font-mono">
                            {line.message}
                        </pre>
                        {line.machines && (
                            <span className="text-gray-400"> → {line.machines.join(', ')}</span>
                        )}
                    </div>
                ))}
                {output.length === 0 && (
                    <div className="text-gray-400">
                        Bienvenue dans le terminal MineOps. Sélectionnez des machines et tapez une commande.
                    </div>
                )}
            </div>

            {/* Zone d'input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/20">
                <div className="flex items-center space-x-2">
                    <span className="text-green-400 font-mono">$</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isExecuting}
                        className="flex-1 bg-transparent text-white font-mono focus:outline-none"
                        placeholder={selectedMachinesCount > 0 ? "Tapez votre commande..." : "Sélectionnez d'abord des machines"}
                        autoComplete="off"
                    />
                    {isExecuting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                </div>
            </form>
        </div>
    );
};

const getOutputClass = (type) => {
    switch (type) {
        case 'command':
            return 'text-yellow-400 font-bold';
        case 'success':
            return 'text-green-400';
        case 'error':
            return 'text-red-400';
        default:
            return 'text-white';
    }
};

export default Terminal;