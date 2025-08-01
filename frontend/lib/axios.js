import axios from "axios";

const api_url = "http://localhost:8000"

const instance = axios.create({
    baseURL: api_url || "http://localhost:8000",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

export default instance;