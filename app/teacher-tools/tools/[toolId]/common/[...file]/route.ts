import { promises as fs } from "node:fs";
import path from "node:path";
import { getToolById } from "@/lib/teacher-tools/tools";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function hasUnsafeSegment(segment: string): boolean {
  return (
    segment.length === 0 ||
    segment === "." ||
    segment === ".." ||
    segment.includes("\\") ||
    segment.includes("/")
  );
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ toolId: string; file: string[] }> }
) {
  const { toolId, file } = await context.params;
  const tool = getToolById(toolId);
  const segments = file ?? [];

  if (!tool || segments.length === 0 || segments.some(hasUnsafeSegment)) {
    return new Response("Not Found", { status: 404 });
  }

  const legacyDir = path.join(process.cwd(), tool.sourceDir);
  const basename = segments[segments.length - 1];
  const localFile = path.join(legacyDir, basename);

  try {
    const body = await fs.readFile(localFile);
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": getContentType(localFile),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    const remoteUrl = `https://mathtool.ruizhiyun.net/common/${segments
      .map(encodeURIComponent)
      .join("/")}`;

    try {
      const upstream = await fetch(remoteUrl, {
        headers: { "user-agent": "teacher-tools-next/1.0" },
        next: { revalidate: 86400 },
      });

      if (!upstream.ok) {
        return new Response("Not Found", { status: 404 });
      }

      const contentType =
        upstream.headers.get("content-type") ?? "application/octet-stream";

      return new Response(await upstream.arrayBuffer(), {
        status: 200,
        headers: {
          "content-type": contentType,
          "cache-control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch {
      return new Response("Bad Gateway", { status: 502 });
    }
  }
}
