import instance from "@/lib/axios";

export const rebootDevice = (ip_address) => 
    instance.post(`/reboot/${ip_address}`);