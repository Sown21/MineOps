"use client";

import { useState } from "react";

const MachineSelector = ({ 
    machines, 
    selectedMachines, 
    onSelectionChange, 
    onClose, 
    className = "" 
}) => {
    const [selectAll, setSelectAll] = useState(false);

    const handleSelectAll = () => {
        if (selectAll) {
            onSelectionChange([]);
        } else {
            onSelectionChange(machines);
        }
        setSelectAll(!selectAll);
    };

    const handleMachineToggle = (machine) => {
        if (selectedMachines.includes(machine)) {
            onSelectionChange(selectedMachines.filter(m => m !== machine));
        } else {
            onSelectionChange([...selectedMachines, machine]);
        }
    };

    return (
        <div className={`
            w-full lg:w-80 
            h-full lg:h-auto
            glass-card 
            p-4 m-0 lg:m-4
            flex flex-col
            ${className}
        `}>
            {/* Header avec bouton fermer mobile */}
            <div className="flex items-center justify-between mb-4 lg:block">
                <h3 className="text-white font-bold text-lg lg:mb-3">
                    Machines ({machines.length})
                </h3>
                <button
                    onClick={onClose}
                    className="lg:hidden text-white hover:text-red-400 text-xl"
                >
                    ✕
                </button>
            </div>
            
            {/* Bouton sélectionner tout */}
            <button
                onClick={handleSelectAll}
                className="w-full mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm lg:text-base"
            >
                {selectAll ? 'Désélectionner tout' : 'Sélectionner tout'}
            </button>

            {/* Liste des machines */}
            <div className="flex-1 overflow-hidden">
                <div className="space-y-2 h-full overflow-y-auto pr-2">
                    {machines.map(machine => (
                        <label 
                            key={machine} 
                            className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedMachines.includes(machine)}
                                onChange={() => handleMachineToggle(machine)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-white text-sm lg:text-base truncate flex-1">
                                {machine}
                            </span>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                Math.random() > 0.3 ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Footer avec compteur */}
            <div className="mt-4 pt-3 border-t border-white/20">
                <span className="text-white/70 text-xs lg:text-sm">
                    {selectedMachines.length} machine{selectedMachines.length > 1 ? 's' : ''} sélectionnée{selectedMachines.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* Actions rapides (mobile uniquement) */}
            <div className="lg:hidden mt-4 pt-3 border-t border-white/20">
                <button
                    onClick={onClose}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                    Valider ({selectedMachines.length})
                </button>
            </div>
        </div>
    );
};

export default MachineSelector;