const AUDIO_MIME_MAP: Record<string, string> = {
  'audio/webm': 'audio/webm',
  'audio/wav': 'audio/wav',
  'audio/mp3': 'audio/mpeg',
  'audio/mpeg': 'audio/mpeg',
  'audio/mp4': 'audio/mp4',
  'audio/m4a': 'audio/mp4',
  'audio/ogg': 'audio/ogg',
};

export function getAudioMimeType(mimeType: string): string {
  return AUDIO_MIME_MAP[mimeType] || 'audio/webm';
}


