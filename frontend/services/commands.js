import instance from "@/lib/axios";

export const executeCommand = async (command, hostnames) => {
    try {
        const response = await instance.post("/execute-command", {
            command,
            hostnames
        }, {
            timeout: 60000
        });

        return response.data.results;
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
};

export const createSSHSession = async (hostname, ipAddress) => {
    try {
        const response = await instance.post("/ssh/create-session", {
            hostname,
            ip_address: ipAddress
        }, {
            timeout: 30000
        });

        return response.data;
    } catch (error) {
        console.error('Error creating SSH session:', error);
        throw error;
    }
};

// SUPPRIMER executeSSHCommand - on utilise maintenant WebSocket
// SUPPRIMER executeSSHCommand - on utilise maintenant WebSocket
// export const executeSSHCommand = async (sessionId, command) => { ... }

export const closeSSHSession = async (sessionId) => {
    try {
        const response = await instance.post("/ssh/close-session", {
            session_id: sessionId
        });

        return response.data;
    } catch (error) {
        console.error('Error closing SSH session:', error);
        throw error;
    }
};