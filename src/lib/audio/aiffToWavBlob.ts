import { isAiff, decodeAiff } from './aiffDecoder';

const MAX_WAV_BYTES = 1024 * 1024 * 1024; // 1 GiB

// <audio> can't play AIFF, so AIFF files are decoded and re-wrapped as a
// 32-bit float WAV at the original sample rate. Anything else is played as is.
export async function prepareAudioUrl(file: File): Promise<string> {
  const head = await file.slice(0, 12).arrayBuffer();
  if (!isAiff(head)) return URL.createObjectURL(file);

  const { channelData, sampleRate, length } = decodeAiff(await file.arrayBuffer());
  const channels = channelData.length;
  const dataSize = length * channels * 4;
  if (dataSize + 44 > MAX_WAV_BYTES) throw new Error('AIFF file is too large to convert');

  const buffer = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buffer);
  const writeTag = (offset: number, tag: string) => {
    for (let i = 0; i < 4; i++) v.setUint8(offset + i, tag.charCodeAt(i));
  };
  writeTag(0, 'RIFF');
  v.setUint32(4, 36 + dataSize, true);
  writeTag(8, 'WAVE');
  writeTag(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 3, true); // WAVE_FORMAT_IEEE_FLOAT
  v.setUint16(22, channels, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * channels * 4, true);
  v.setUint16(32, channels * 4, true);
  v.setUint16(34, 32, true);
  writeTag(36, 'data');
  v.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < channels; c++) {
      v.setFloat32(offset, channelData[c][i], true);
      offset += 4;
    }
  }
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}
