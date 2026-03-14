'use client';

import { useState, useCallback, useRef } from 'react';

interface UseQwenAsrInputOptions {
  disabled?: boolean;
  maxDurationMs?: number;
  onText?: (text: string) => void;
}

interface UseQwenAsrInputReturn {
  isRecording: boolean;
  isProcessing: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function useQwenAsrInput({
  disabled = false,
  maxDurationMs = 30000,
  onText,
}: UseQwenAsrInputOptions = {}): UseQwenAsrInputReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(async () => {
    if (disabled || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/ai-education/api/asr', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('ASR request failed');
          }

          const data = await response.json();
          if (data.text && onText) {
            onText(data.text);
          }
        } catch (error) {
          console.error('ASR processing error:', error);
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // 自动停止录音
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, maxDurationMs);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [disabled, isRecording, maxDurationMs, onText]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    start,
    stop,
  };
}
