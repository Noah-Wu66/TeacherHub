export const VOICE_QA_TOOL_TITLE = "你问我答";
export const VOICE_QA_TTS_SAMPLE_RATE = 24000;
export const VOICE_QA_INPUT_SAMPLE_RATE = 16000;
export const VOICE_QA_TTS_FORMAT = "pcm_s16le";
export const VOICE_QA_INPUT_FORMAT = "pcm_s16le";

export type VoiceQaSessionResponse = {
  sessionId: string;
  realtimeUrl: string;
  userType: "formal" | "guest";
  displayName: string;
  greeting: string;
  toolTitle: string;
  speaker: string;
  outputSampleRate: number;
  outputFormat: string;
  inputSampleRate: number;
  inputFormat: string;
};

export type VoiceQaTurnRequest = {
  sessionId: string;
  turnId: string;
  dialogId?: string;
  systemRole?: string;
  audio: string;
  sampleRate: number;
  format: string;
  channelCount: number;
};

export type VoiceQaServerEvent =
  | { type: "session_started"; sessionId: string; turnId: string; dialogId: string }
  | { type: "listening"; sessionId: string }
  | { type: "user_transcript_delta"; content: string }
  | { type: "user_transcript_final"; content: string }
  | { type: "assistant_text_delta"; content: string }
  | { type: "assistant_text_final"; content: string }
  | {
      type: "assistant_audio_chunk";
      audio: string;
      audioFormat: string;
      sampleRate: number;
    }
  | { type: "assistant_audio_end" }
  | { type: "interrupted" }
  | { type: "session_finished"; sessionId: string; turnId: string; dialogId: string }
  | { type: "error"; error: string };
