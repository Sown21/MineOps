export const executeCommand = async (command, hostnames) => {
    try {
        const response = await fetch(`${API_BASE_URL}/execute-command`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                command,
                hostnames
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
};