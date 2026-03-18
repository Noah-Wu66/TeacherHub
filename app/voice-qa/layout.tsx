import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "你问我答",
  description: "李雪老师语音互动工具",
};

export default function VoiceQaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
