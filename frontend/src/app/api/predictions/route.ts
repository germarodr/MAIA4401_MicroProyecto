import { proxyApi } from "@/lib/api-proxy";

export const GET = () => proxyApi("predictions");
export const POST = (request: Request) => proxyApi("predictions", request);
