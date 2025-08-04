// Installer un agent

import instance from "@/lib/axios";

export const addMiner = (ip, user, password) =>
    instance.post("/add-miner", {
        ip_address: ip,
        user,
        password
    }, {
        timeout: 240000
    });