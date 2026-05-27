import * as THREE from 'three';

export class AudioAnalyzer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  public audio: HTMLAudioElement;
  public streamDestination: MediaStreamAudioDestinationNode | null = null;
  private dataArray: Uint8Array | null = null;
  public audioTexture: THREE.DataTexture;
  
  public bass: number = 0;
  public treble: number = 0;

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    
    // Initialize a dummy texture
    const size = 256;
    const data = new Uint8Array(size * 4);
    this.audioTexture = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
    this.audioTexture.needsUpdate = true;
  }

  public init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512; // 256 bins
    
    // Create destination for recording
    this.streamDestination = this.ctx.createMediaStreamDestination();
    
    this.source = this.ctx.createMediaElementSource(this.audio);
    this.source.connect(this.analyser);
    
    // Connect to speakers and recording destination
    this.analyser.connect(this.ctx.destination);
    this.analyser.connect(this.streamDestination);
    
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }

  public getAudioStream(): MediaStream | null {
    return this.streamDestination ? this.streamDestination.stream : null;
  }

  public async loadAudio(file: File) {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
    const url = URL.createObjectURL(file);
    this.audio.src = url;
    // Removed automatic playback so user can start manually
  }

  public togglePlay() {
    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  public updateTexture() {
    if (!this.analyser || !this.dataArray || !this.audioTexture.image) return;
    this.analyser.getByteFrequencyData(this.dataArray as any);
    
    const data = this.audioTexture.image.data;
    if (!data) return;
    
    // Extract Bass and Treble for global uniforms
    let bassSum = 0;
    let trebleSum = 0;
    
    // Low frequencies (roughly bins 0-10)
    for (let i = 0; i < 10; i++) {
      bassSum += this.dataArray[i];
    }
    // High frequencies (roughly bins 150-250)
    for (let i = 150; i < 250; i++) {
      trebleSum += this.dataArray[i];
    }
    
    this.bass = (bassSum / 10) / 255.0;
    this.treble = (trebleSum / 100) / 255.0;
    
    // Write frequency data to the red channel of the texture
    for (let i = 0; i < this.dataArray.length; i++) {
      data[i * 4] = this.dataArray[i]; // R
      data[i * 4 + 1] = 0; // G
      data[i * 4 + 2] = 0; // B
      data[i * 4 + 3] = 255; // A
    }
    this.audioTexture.needsUpdate = true;
  }

  public isPlaying(): boolean {
    return !this.audio.paused;
  }
}

export const audioAnalyzer = new AudioAnalyzer();
