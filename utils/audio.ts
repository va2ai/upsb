
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    // Fix: Remove deprecated `window.webkitAudioContext` as it's no longer necessary and causes a TypeScript error.
    // `window.AudioContext` is widely supported.
    audioContext = new (window.AudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function playBase64Audio(base64EncodedAudioString: string): Promise<void> {
  const ctx = getAudioContext();
  
  // Ensure the context is resumed if it was suspended (e.g., by browser policies)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const audioBytes = decode(base64EncodedAudioString);
  const audioBuffer = await decodeAudioData(
    audioBytes,
    ctx,
    24000, // Sample rate as per Gemini TTS example
    1,     // Number of channels as per Gemini TTS example
  );

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.start(ctx.currentTime);
}