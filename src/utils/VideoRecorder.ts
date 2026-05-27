export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  public startRecording(canvas: HTMLCanvasElement) {
    this.recordedChunks = [];

    // Capture WebGL video stream (at 60fps)
    const videoStream = canvas.captureStream(60);

    // Try to use VP9 or VP8 for WebM
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm'; // Fallback
      }
    }

    this.mediaRecorder = new MediaRecorder(videoStream, {
      mimeType,
      videoBitsPerSecond: 250000000, // 250 Mbps for Ultra High Quality
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.downloadVideo();
    };

    this.mediaRecorder.start();
  }

  public stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
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
