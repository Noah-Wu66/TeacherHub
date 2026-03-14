import { promises as fs } from "node:fs";
import path from "node:path";
import { getToolById } from "@/lib/teacher-tools/tools";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
};

const LEGACY_PARENT_SHIM = `<script>
(function(){
  try {
    if (!window.parent || window.parent === window) return;
    var p = window.parent;
    var d = p.document;
    if (!d) return;
    var mountRoot = d.body || d.documentElement;
    if (!mountRoot) return;
    var rawGet = d.getElementById ? d.getElementById.bind(d) : null;
    function ensure(id, tag) {
      if (!id) return null;
      var node = rawGet ? rawGet(id) : null;
      if (node) return node;
      node = d.createElement(tag || "div");
      node.id = id;
      node.style.display = "none";
      if (tag === "input") node.value = "";
      mountRoot.appendChild(node);
      return node;
    }
    d.getElementById = function(id) {
      var node = rawGet ? rawGet(id) : null;
      if (node) return node;
      var tag = (id === "tid" || id === "userTokenId") ? "input" : "div";
      return ensure(id, tag);
    };
    window.__legacyGetParentEl = function(id) {
      var node = d.getElementById(id);
      if (node) return node;
      return { style: {}, innerHTML: "", value: "" };
    };
    ensure("next_div", "div");
    ensure("tool_title", "div");
    ensure("operate_span", "div");
    ensure("tool_operation", "div");
    ensure("operation_div", "div");
    ensure("operation_content", "div");
    ensure("tid", "input");
    ensure("userTokenId", "input");
    if (typeof p.OPERATION_TAG_START !== "string") p.OPERATION_TAG_START = "";
    if (typeof p.OPERATION_TAG_END !== "string") p.OPERATION_TAG_END = "";
    if (typeof p.DASHED_LINE !== "string") p.DASHED_LINE = "";
  } catch (e) {}
})();
</script>`;

function rejectUnsafeSegment(segment: string): boolean {
  return (
    segment.length === 0 ||
    segment === "." ||
    segment === ".." ||
    segment.includes("\\") ||
    segment.includes("/")
  );
}

function cacheHeaderByExt(ext: string): string {
  if (ext === ".html") {
    return "no-store";
  }
  return "public, max-age=31536000, immutable";
}

function sanitizeMainToolHtml(rawHtml: string): string {
  return rawHtml
    .replace(
      /<style id="supercopy_user_select">[\s\S]*?<\/style>/,
      ""
    )
    .replace(
      /<style data-id="immersive-translate-input-injected-css">[\s\S]*?<\/style>/,
      ""
    )
    .replace(/<script>\s*\/\/按键触发[\s\S]*?<\/script>/, "")
    .replace(
      /(?:window\["parent"\]|window\['parent'\]|parent|window\["\\u0070\\u0061\\u0072\\u0065\\u006e\\u0074"\]|window\['\\u0070\\u0061\\u0072\\u0065\\u006e\\u0074'\])\[(?:"|')?(?:document|\\u0064\\u006f\\u0063\\u0075\\u006d\\u0065\\u006e\\u0074)(?:"|')?\]\[(?:"|')?(?:getElementById|\\u0067\\u0065\\u0074\\u0045\\u006c\\u0065\\u006d\\u0065\\u006e\\u0074\\u0042\\u0079\\u0049\\u0064)(?:"|')?\]/g,
      "window.__legacyGetParentEl"
    )
    .replace(/<body[^>]*>/i, (tag) => `${tag}${LEGACY_PARENT_SHIM}`);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ toolId: string; file: string[] }> }
) {
  const { toolId, file } = await context.params;
  const tool = getToolById(toolId);

  if (!tool) {
    return new Response("Not Found", { status: 404 });
  }

  const safeSegments = file ?? [];
  if (safeSegments.length === 0 || safeSegments.some(rejectUnsafeSegment)) {
    return new Response("Bad Request", { status: 400 });
  }

  const legacyDir = path.join(process.cwd(), tool.sourceDir);
  const targetPath = path.join(legacyDir, ...safeSegments);
  const normalizedPath = path.normalize(targetPath);
  const normalizedBase = path.normalize(`${legacyDir}${path.sep}`);

  if (!normalizedPath.startsWith(normalizedBase)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const ext = path.extname(normalizedPath).toLowerCase();
    const requestedFile = safeSegments.join("/");

    if (requestedFile === tool.entryFile) {
      const html = await fs.readFile(normalizedPath, "utf8");
      return new Response(sanitizeMainToolHtml(html), {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    const fileBuffer = await fs.readFile(normalizedPath);
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": cacheHeaderByExt(ext),
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
