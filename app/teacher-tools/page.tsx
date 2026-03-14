import Link from "next/link";
import ToolAccessGuard from "@/components/platform/auth/ToolAccessGuard";

export default function HomePage() {
  return (
    <ToolAccessGuard allowGuest reason="请先登录正式账号或游客账号后再使用三视图教学工具。">
      <main className="page-shell">
        <section className="card">
          <h1 className="title">李雪云交互式教学工具</h1>
          <p className="muted">
            所有题型已经合并到一个配置页，不用在多个工具入口之间反复切换。
          </p>
          <p className="muted">可以直接选“一个/两个/三个视图”和“基础/4块/5块”来切换题型。</p>
          <Link className="tool-link tool-center-link" href="/teacher-tools/tools">
            进入工具设置页
          </Link>
        </section>
      </main>
    </ToolAccessGuard>
  );
}
