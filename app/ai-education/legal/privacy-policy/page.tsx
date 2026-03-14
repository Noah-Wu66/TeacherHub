export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="max-w-4xl w-full bg-card shadow-lg rounded-xl p-8 border border-border">
                <h1 className="text-3xl font-bold text-foreground mb-8 border-b pb-4">隐私保护协议</h1>

                <div className="space-y-6 text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">1. 信息收集</h2>
                        <p>
                            为了向您提供更好的服务，我们需要收集您的部分个人信息，包括但不限于：
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>注册信息：如您的姓名、邮箱、年级、班级等；</li>
                            <li>使用记录：您在使用 AI 教学助手时的对话记录与操作日志；</li>
                            <li>设备信息：您的浏览器类型、IP地址等基础设备信息。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">2. 信息存储</h2>
                        <p>
                            您的个人信息将加密存储于位于香港特别行政区的 MongoDB 数据中心。
                            我们采用业界领先的安全技术和程序，防止您的信息遭到未经授权的访问、使用或泄露。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">3. 信息使用</h2>
                        <p>
                            我们收集的信息将主要用于：
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>为您提供个性化的教学辅导服务；</li>
                            <li>优化我们的产品功能与用户体验；</li>
                            <li>保障系统运行安全。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">4. 信息共享</h2>
                        <p>
                            除非获得您的明确同意或法律法规另有规定，我们不会向任何第三方出售、出租或分享您的个人信息。
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
