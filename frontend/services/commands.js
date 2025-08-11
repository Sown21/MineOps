import instance from "@/lib/axios";

export const executeCommand = async (command, hostnames) => {
    try {
        const response = await instance.post("/execute-command", {
            command,
            hostnames
        }, {
            timeout: 60000 // Timeout de 60 secondes pour l'exécution de commandes
        });

        return response.data.results;
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
};