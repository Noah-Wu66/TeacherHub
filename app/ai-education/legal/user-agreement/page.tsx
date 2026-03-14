export default function UserAgreementPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="max-w-4xl w-full bg-card shadow-lg rounded-xl p-8 border border-border">
                <h1 className="text-3xl font-bold text-foreground mb-8 border-b pb-4">用户协议</h1>

                <div className="space-y-6 text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">1. 服务条款的接受</h2>
                        <p>
                            欢迎使用 AI Education 平台（以下简称“本平台”）。本协议是您与本平台之间关于您使用本平台服务所订立的协议。
                            请您在注册成为本平台用户前，仔细阅读本协议的所有内容。一旦您选择“同意”并完成注册流程，即表示您已充分阅读、理解并自愿接受本协议的全部内容。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">2. 服务内容</h2>
                        <p>
                            本平台依托 Vercel 香港节点与 MongoDB 香港数据中心，为您提供基于人工智能的教育辅助服务。
                            我们致力于通过先进的技术手段，提升教育教学的效率与质量。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">3. 用户行为规范</h2>
                        <p>
                            您在使用本平台服务过程中，必须遵守中华人民共和国相关法律法规及香港特别行政区相关法律规定。
                            您不得利用本平台制作、复制、发布、传播任何违法违规内容，包括但不限于：
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>危害国家安全，泄露国家秘密的；</li>
                            <li>宣扬恐怖主义、极端主义的；</li>
                            <li>侮辱或者诽谤他人，侵害他人合法权益的；</li>
                            <li>其他违反法律法规的内容。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">4. 账号安全</h2>
                        <p>
                            您有责任妥善保管您的账号及密码信息。因您自身原因导致的账号丢失或密码泄露，进而产生的任何损失，由您自行承担。
                            若发现账号被非法使用，请立即联系我们要回账号。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">5. 协议的变更</h2>
                        <p>
                            本平台有权根据法律法规的变化及服务运营的需要，对本协议内容进行修改。
                            修改后的协议一旦公布即有效替代原来的协议。您可随时登录本平台查阅最新协议内容。
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
