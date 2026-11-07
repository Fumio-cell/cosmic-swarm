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

    // Try VP9 with Opus audio first (best quality WebM), fall back gracefully
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
    }

    this.mediaRecorder = new MediaRecorder(videoStream, {
      mimeType,
      videoBitsPerSecond: 250000000, // 250 Mbps video
      audioBitsPerSecond: 320000,    // 320 kbps audio (high quality)
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    // Runs for every finish that saves a file: the length cap, the track
    // ending, or a manual stopRecording(). cancelRecording() clears it.
    this.mediaRecorder.onstop = () => {
      this.downloadVideo();
      onComplete?.();
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
  }

  private downloadVideo() {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `cosmic_swarm_render_${Date.now()}.webm`;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

export const videoRecorder = new VideoRecorder();
