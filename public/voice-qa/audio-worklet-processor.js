// AudioWorklet processor for voice capture
// This file is loaded as a worklet module

class VoiceCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isCapturing = false;
    
    this.port.onmessage = (event) => {
      if (event.data.type === 'start') {
        this.isCapturing = true;
      } else if (event.data.type === 'stop') {
        this.isCapturing = false;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (this.isCapturing && input && input[0]) {
      // Send audio data to main thread
      const channelData = input[0];
      // Create a copy to avoid reference issues
      const audioData = new Float32Array(channelData);
      this.port.postMessage({
        type: 'audio',
        data: audioData
      }, [audioData.buffer.slice(audioData.byteOffset, audioData.byteOffset + audioData.byteLength)]);
    }

    return true;
  }
}

registerProcessor('voice-capture-processor', VoiceCaptureProcessor);
