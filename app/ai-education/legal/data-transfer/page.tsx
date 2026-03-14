export default function DataTransferPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="max-w-4xl w-full bg-card shadow-lg rounded-xl p-8 border border-border">
                <h1 className="text-3xl font-bold text-foreground mb-8 border-b pb-4">个人数据跨境传输协议</h1>

                <div className="space-y-6 text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">1. 特别告知</h2>
                        <p>
                            鉴于本平台（AI Education）的服务架构特点，我们需要特别告知您：
                            为了向您提供稳定、高效的服务，您的个人数据（包括注册信息及使用产生的数据）将被传输至并存储于日本东京。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">2. 数据存储地点</h2>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>应用服务部署：</strong> Vercel（日本东京节点）</li>
                            <li><strong>数据库服务：</strong> Zeabur MongoDB（日本东京数据中心）</li>
                        </ul>
                        <p className="mt-2">
                            您同意并授权我们将您的相关数据传输至上述位于日本东京的服务器进行存储和处理。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">3. 适用法律与保护</h2>
                        <p>
                            您的数据在日本存储期间，将受到日本《个人信息保护法》（APPI）的保护，同时我们也会严格遵守中国大陆相关数据出境安全管理的法律法规要求。
                            我们将采取严格的技术措施和管理手段，确保您的数据在跨境传输及存储过程中的安全。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">4. 您的权利</h2>
                        <p>
                            您有权随时联系我们，查询您的数据跨境存储情况，或要求更正、删除您的个人数据。
                            若您不同意本协议，将无法使用本平台的部分或全部服务。
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
