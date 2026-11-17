/**
 * The audio of an MP4 that MediaRecorder writes starts with the lead-in of the AAC encoder: about 2112 samples
 * (48 ms at 44.1 kHz) before the first real sample. MediaRecorder leaves it in and writes no edit list, so the
 * sound arrives that much late against the picture. An edit list on the audio track that starts the track
 * `leadIn` samples into its media is the correction every player and editor honours.
 *
 * MediaRecorder writes a fragmented file: the moov box is first and holds no sample tables, so nothing in it
 * points into the media and the box can grow freely. The only absolute offsets are in the optional mfra box at the
 * end, which is dropped.
 */

/** What Chrome's AAC-LC encoder puts before the first real sample on macOS (measured: 47.7 to 48.0 ms at 44.1 kHz). */
export const AAC_LEAD_IN_SAMPLES = 2112;

interface Box {
  type: string;
  start: number;
  header: number;
  end: number;
}

const fourcc = (v: DataView, at: number) => String.fromCharCode(v.getUint8(at), v.getUint8(at + 1), v.getUint8(at + 2), v.getUint8(at + 3));

function boxesIn(v: DataView, start: number, end: number): Box[] {
  const found: Box[] = [];
  let at = start;
  while (at + 8 <= end) {
    let size = v.getUint32(at);
    let header = 8;
    if (size === 1) {
      size = Number(v.getBigUint64(at + 8));
      header = 16;
    } else if (size === 0) {
      size = end - at;
    }
    if (size < header || at + size > end) break;
    found.push({ type: fourcc(v, at + 4), start: at, header, end: at + size });
    at += size;
  }
  return found;
}

const child = (v: DataView, parent: Box, type: string): Box | undefined =>
  boxesIn(v, parent.start + parent.header, parent.end).find((b) => b.type === type);

/**
 * Returns `file` with an edit list on its audio track that skips `leadIn` samples, or null when the file is not
 * what is expected (no moov, no audio track, an edit list already there). `file` is not changed.
 */
export function addAudioLeadInEdit(file: ArrayBuffer, leadIn: number = AAC_LEAD_IN_SAMPLES): ArrayBuffer | null {
  const v = new DataView(file);
  const top = boxesIn(v, 0, file.byteLength);
  const moov = top.find((b) => b.type === 'moov');
  if (!moov || moov.header !== 8) return null;

  const audio = boxesIn(v, moov.start + moov.header, moov.end).find((t) => {
    if (t.type !== 'trak' || t.header !== 8) return false;
    const mdia = child(v, t, 'mdia');
    const hdlr = mdia && child(v, mdia, 'hdlr');
    return hdlr !== undefined && fourcc(v, hdlr.start + hdlr.header + 8) === 'soun';
  });
  const tkhd = audio && child(v, audio, 'tkhd');
  if (!audio || !tkhd || child(v, audio, 'edts')) return null;

  // Only AAC has this lead-in. The track's time scale is normally its sample rate; if not, scale the count.
  const mdia = child(v, audio, 'mdia');
  const mdhd = mdia && child(v, mdia, 'mdhd');
  const minf = mdia && child(v, mdia, 'minf');
  const stbl = minf && child(v, minf, 'stbl');
  const stsd = stbl && child(v, stbl, 'stsd');
  if (!mdhd || !stsd) return null;
  const entry = stsd.start + stsd.header + 8; // full-box header and entry count, then the first sample entry
  if (fourcc(v, entry + 4) !== 'mp4a') return null;
  const timescale = v.getUint32(mdhd.start + mdhd.header + (v.getUint8(mdhd.start + mdhd.header) === 1 ? 20 : 12));
  const sampleRate = v.getUint16(entry + 32); // 16.16 fixed point; the whole part
  if (!timescale || !sampleRate) return null;

  // Play the media from `leadIn` samples in, for as long as it lasts: a fragmented file does not know its length yet.
  const edts = new Uint8Array(36);
  const e = new DataView(edts.buffer);
  e.setUint32(0, 36);
  edts.set([0x65, 0x64, 0x74, 0x73], 4); // edts
  e.setUint32(8, 28);
  edts.set([0x65, 0x6c, 0x73, 0x74], 12); // elst
  e.setUint32(16, 0); // version 0, flags 0
  e.setUint32(20, 1); // one entry
  e.setUint32(24, 0x7fffffff); // segment duration, in movie time scale units: to the end of the media
  e.setInt32(28, Math.round((leadIn * timescale) / sampleRate)); // in media time scale units
  e.setUint32(32, 0x00010000); // rate 1.0

  const mfra = top.find((b) => b.type === 'mfra');
  const keepUntil = mfra ? mfra.start : file.byteLength;
  const at = tkhd.end;
  const out = new Uint8Array(keepUntil + edts.byteLength);
  const src = new Uint8Array(file);
  out.set(src.subarray(0, at));
  out.set(edts, at);
  out.set(src.subarray(at, keepUntil), at + edts.byteLength);
  const o = new DataView(out.buffer);
  o.setUint32(moov.start, moov.end - moov.start + edts.byteLength);
  o.setUint32(audio.start, audio.end - audio.start + edts.byteLength);
  return out.buffer;
}
