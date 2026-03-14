export const dynamic = "force-dynamic";

const REMOTE_IMAGE_BASE = "https://mathtool.ruizhiyun.net/images";

const IMAGE_ALIASES: Record<string, string> = {
  "images_newlesson2/short_btn_blue.png": "img/global/squareBtn.png",
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
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const segments = path ?? [];

  if (segments.length === 0 || segments.some(hasUnsafeSegment)) {
    return new Response("Bad Request", { status: 400 });
  }

  const requestedPath = segments.join("/");
  const resolvedPath = IMAGE_ALIASES[requestedPath] ?? requestedPath;
  const remoteUrl = `${REMOTE_IMAGE_BASE}/${resolvedPath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  try {
    const upstream = await fetch(remoteUrl, {
      method: "GET",
      headers: {
        "user-agent": "teacher-tools-next/1.0",
      },
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return new Response("Not Found", { status: 404 });
    }

    const body = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";

    return new Response(body, {
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
