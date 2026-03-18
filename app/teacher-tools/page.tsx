import Link from "next/link";
import ToolAccessGuard from "@/components/platform/auth/ToolAccessGuard";

export default function HomePage() {
  return (
    <ToolAccessGuard allowGuest reason="请先登录正式账号或游客账号后再使用教师工具。">
      <main className="page-shell">
        <section className="card">
          <h1 className="title">三视图教学工具</h1>
          <p className="muted">
            这里保留三视图工具，继续使用一个、两个、三个视图和基础、四块、五块切换题型。
          </p>
          <div className="tool-home-grid">
            <article className="tool-home-card">
              <p className="tool-home-eyebrow">空间想象</p>
              <h2 className="tool-home-title">三视图教学工具</h2>
              <p className="muted">
                继续使用一个、两个、三个视图和基础、四块、五块切换题型。
              </p>
              <Link className="tool-link tool-center-link" href="/teacher-tools/tools">
                进入工具设置页
              </Link>
            </article>
          </div>
        </section>
      </main>
    </ToolAccessGuard>
  );
}
