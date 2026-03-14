import { GET as sharedGET } from "@/app/api/auth/status/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = sharedGET;
