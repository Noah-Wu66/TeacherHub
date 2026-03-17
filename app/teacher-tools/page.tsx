import Link from "next/link";
import ToolAccessGuard from "@/components/platform/auth/ToolAccessGuard";

export default function HomePage() {
  return (
    <ToolAccessGuard allowGuest reason="请先登录正式账号或游客账号后再使用教师工具。">
      <main className="page-shell">
        <section className="card">
          <h1 className="title">李雪云交互式教学工具</h1>
          <p className="muted">
            这里现在有两类工具：一类是原来的三视图教学工具，另一类是新的语音问答工具。
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
            <article className="tool-home-card tool-home-card-accent">
              <p className="tool-home-eyebrow">语音互动</p>
              <h2 className="tool-home-title">你问我答</h2>
              <p className="muted">
                学生可以直接开口提问，李雪老师会用语音和文字一起回答。
              </p>
              <Link className="tool-link tool-center-link" href="/teacher-tools/voice-qa">
                打开语音工具
              </Link>
            </article>
          </div>
        </section>
      </main>
    </ToolAccessGuard>
  );
}
