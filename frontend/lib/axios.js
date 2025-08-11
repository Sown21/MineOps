import axios from "axios";

// const api_url = process.env.API_URL
const api_url = "http://localhost:8000"

const instance = axios.create({
    // baseURL: api_url || "http://localhost:8000",
    baseURL: api_url,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

export default instance;