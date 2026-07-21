const DEFAULT_CONSULTATION_ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

export const getConfiguredIceServers = (iceServers: RTCIceServer[] = []) =>
  iceServers.length > 0 ? iceServers : DEFAULT_CONSULTATION_ICE_SERVERS;

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private onRemoteStream: (stream: MediaStream) => void;
  private onIceCandidate: (candidate: RTCIceCandidate) => void;
  private onConnectionStateChange?: (state: RTCPeerConnectionState) => void;

  constructor(
    iceServers: RTCIceServer[],
    onRemoteStream: (stream: MediaStream) => void,
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  ) {
    this.onRemoteStream = onRemoteStream;
    this.onIceCandidate = onIceCandidate;
    this.onConnectionStateChange = onConnectionStateChange;
    this.peerConnection = new RTCPeerConnection({
      iceServers: getConfiguredIceServers(iceServers)
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) this.onIceCandidate(event.candidate);
    };

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) this.onConnectionStateChange?.(this.peerConnection.connectionState);
    };
  }

  async startLocalStream(): Promise<MediaStream> {
    const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio
      });
    } catch {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio });
    }

    this.localStream.getTracks().forEach((track) => {
      if (this.peerConnection && this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });

    return this.localStream;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('PC not initialized');
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('PC not initialized');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) throw new Error('PC not initialized');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) throw new Error('PC not initialized');
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  replaceLocalTrack(track: MediaStreamTrack, stream: MediaStream) {
    if (!this.peerConnection) return;
    const sender = this.peerConnection.getSenders().find((item) => item.track?.kind === track.kind);
    if (sender) {
      void sender.replaceTrack(track);
      return;
    }
    this.peerConnection.addTrack(track, stream);
  }

  stop() {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.peerConnection?.close();
    this.localStream = null;
    this.peerConnection = null;
  }
}
