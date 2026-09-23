import { proxyApi } from "@/lib/api-proxy";

export const GET = () => proxyApi("health");
