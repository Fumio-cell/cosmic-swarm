import { releaseRecordingFrame } from './recordingStage';
import { addAudioLeadInEdit } from './mp4Edit';

/**
 * What to record. H.264 in MP4 first: the browser encodes it in hardware and holds 60 fps at 1080p, where the
 * software VP9 encoder delivered about 27 fps. WebM (VP9, then VP8) only when no MP4 type is supported.
 * The H.264 encoder delivers about twice the bitrate it is asked for on this content: 10 Mbps asked is about
 * 20 Mbps written, 25 MB for 10 s of 1080p60.
 */
const FORMATS = [
  { mimeType: 'video/mp4;codecs=avc1,mp4a.40.2', videoBitsPerSecond: 10_000_000 },
  { mimeType: 'video/mp4;codecs=avc1,opus', videoBitsPerSecond: 10_000_000 },
  { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 250_000_000 },
  { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 250_000_000 },
  { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 250_000_000 },
];

function pickRecordingFormat() {
  return FORMATS.find((f) => MediaRecorder.isTypeSupported(f.mimeType)) ?? { mimeType: 'video/webm', videoBitsPerSecond: 250_000_000 };
}

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private autoStopTimer: ReturnType<typeof setTimeout> | null = null;

  public startRecording(
    canvas: HTMLCanvasElement,
    audioStream?: MediaStream | null,
    maxDurationMs?: number,
    onAutoStop?: () => void,
    onComplete?: () => void
  ) {
    this.recordedChunks = [];
    this.clearAutoStopTimer();

    // Capture WebGL video stream (at 60fps)
    const videoStream = canvas.captureStream(60);

    // Merge audio tracks into the video stream when available
    if (audioStream) {
      audioStream.getAudioTracks().forEach((track) => videoStream.addTrack(track));
    }

    const { mimeType, videoBitsPerSecond } = pickRecordingFormat();

    try {
      this.mediaRecorder = new MediaRecorder(videoStream, {
        mimeType,
        videoBitsPerSecond,
        audioBitsPerSecond: 320000,    // 320 kbps audio (high quality)
      });
    } catch (e) {
      releaseRecordingFrame();
      throw e;
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    // Runs for every finish that saves a file: the length cap, the track
    // ending, or a manual stopRecording(). cancelRecording() clears it.
    // The stage goes back to the window's size first.
    this.mediaRecorder.onstop = () => {
      releaseRecordingFrame();
      void this.downloadVideo().finally(() => onComplete?.());
    };

    this.mediaRecorder.start();

    // Demo builds cap export length; the recording still saves normally,
    // it just stops itself early and tells the caller it did.
    if (maxDurationMs !== undefined) {
      this.autoStopTimer = setTimeout(() => {
        this.autoStopTimer = null;
        this.stopRecording();
        onAutoStop?.();
      }, maxDurationMs);
    }
  }

  private clearAutoStopTimer() {
    if (this.autoStopTimer !== null) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }
  }

  public stopRecording() {
    this.clearAutoStopTimer();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  public cancelRecording() {
    this.clearAutoStopTimer();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      // Suppress the onstop download by clearing the handler before stopping.
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }
    this.recordedChunks = [];
    releaseRecordingFrame();
  }

  private async downloadVideo(): Promise<void> {
    // The container the browser actually wrote decides the type and the extension.
    const isMp4 = (this.mediaRecorder?.mimeType ?? '').startsWith('video/mp4');
    let blob = new Blob(this.recordedChunks, { type: isMp4 ? 'video/mp4' : 'video/webm' });
    if (isMp4) {
      // The AAC lead-in would otherwise put the sound about 48 ms behind the picture. If the edit cannot be made, the
      // recording is saved as it is.
      try {
        const edited = addAudioLeadInEdit(await blob.arrayBuffer());
        if (edited) blob = new Blob([edited], { type: 'video/mp4' });
      } catch {
        /* keep the recording as the browser wrote it */
      }
    }
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `cosmic_swarm_render_${Date.now()}.${isMp4 ? 'mp4' : 'webm'}`;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

export const videoRecorder = new VideoRecorder();
