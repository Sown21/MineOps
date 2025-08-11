"use client";

import { useState, useEffect } from "react";
import Terminal from "@/components/Terminal";
import MachineSelector from "@/components/MachineSelector";
import { executeCommand } from "@/services/commands";
import { getMetrics } from "@/services/metrics";

const TerminalPage = () => {
    const [hostnames, setHostnames] = useState([]);
    const [selectedMachines, setSelectedMachines] = useState([]);
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [showMachineSelector, setShowMachineSelector] = useState(false);

    // Récupérer la liste des machines
    useEffect(() => {
        const fetchMachines = async () => {
            try {
                const response = await getMetrics();
                const uniqueHostnames = [...new Set(response.data.map(metric => metric.hostname))];
                setHostnames(uniqueHostnames);
            } catch (error) {
                console.error("Erreur lors de la récupération des machines:", error);
            }
        };
        fetchMachines();
    }, []);

    const executeCommandOnMachines = async (command) => {
        if (selectedMachines.length === 0) {
            setTerminalOutput(prev => [...prev, { type: 'error', message: 'Aucune machine sélectionnée' }]);
            return;
        }

        setIsExecuting(true);
        setTerminalOutput(prev => [...prev, { 
            type: 'command', 
            message: `$ ${command}`,
            machines: selectedMachines 
        }]);

        try {
            const results = await executeCommand(command, selectedMachines);
            results.forEach(result => {
                setTerminalOutput(prev => [...prev, {
                    type: result.success ? 'success' : 'error',
                    machine: result.hostname,
                    message: result.output
                }]);
            });
        } catch (error) {
            setTerminalOutput(prev => [...prev, { 
                type: 'error', 
                message: `Erreur: ${error.message}` 
            }]);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="h-256 flex flex-col lg:flex-row">
            {/* Sidebar pour sélection des machines */}
            <div className={`
                lg:relative lg:block
                ${showMachineSelector ? 'fixed inset-0 z-50 bg-black/50 lg:bg-transparent' : 'hidden lg:block'}
            `}>
                <MachineSelector 
                    machines={hostnames}
                    selectedMachines={selectedMachines}
                    onSelectionChange={setSelectedMachines}
                    onClose={() => setShowMachineSelector(false)}
                    className="lg:relative lg:z-auto"
                />
            </div>
            
            {/* Terminal principal */}
            <Terminal 
                output={terminalOutput}
                onCommandExecute={executeCommandOnMachines}
                isExecuting={isExecuting}
                selectedMachinesCount={selectedMachines.length}
                onToggleMachines={() => setShowMachineSelector(!showMachineSelector)}
                className="flex-1"
            />
        </div>
    );
};

export default TerminalPage;