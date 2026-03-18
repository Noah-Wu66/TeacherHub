import ToolAccessGuard from "@/components/platform/auth/ToolAccessGuard";
import VoiceQaClient from "@/components/teacher-tools/voice-qa/VoiceQaClient";

export default function VoiceQaPage() {
  return (
    <ToolAccessGuard allowGuest reason="请先登录正式账号或游客账号后再使用你问我答。">
      <VoiceQaClient />
    </ToolAccessGuard>
  );
}
