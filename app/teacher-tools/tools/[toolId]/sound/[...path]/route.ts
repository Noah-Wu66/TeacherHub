import { getToolById } from "@/lib/teacher-tools/tools";

export const dynamic = "force-dynamic";

const SOUND_ALIASES: Record<string, string> = {
  "correct_short.ogg": "finish-right.ogg",
  "correct_short.mp3": "finish-right.mp3",
  "wrong_short.ogg": "finish-wrong.ogg",
  "wrong_short.mp3": "finish-wrong.mp3",
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ toolId: string; path: string[] }> }
) {
  const { toolId, path: pathSegments } = await context.params;
  const tool = getToolById(toolId);
  const segments = pathSegments ?? [];

  if (!tool || segments.length === 0 || segments.some(hasUnsafeSegment)) {
    return new Response("Not Found", { status: 404 });
  }

  const requestedPath = segments.join("/");
  const resolvedPath = SOUND_ALIASES[requestedPath] ?? requestedPath;
  const remoteUrl = `https://mathtool.ruizhiyun.net/sound/${resolvedPath
    .split("/")
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
