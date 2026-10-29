import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/config";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  ...(import.meta.env.VITE_TURN_URL
    ? [
        {
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL,
        },
      ]
    : []),
];

function requireMediaDevices() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "Camera and microphone require HTTPS or localhost. Open the app using HTTPS on the second laptop.",
    );
  }

  return navigator.mediaDevices;
}

export function useVideoCall({ roomId, token, username }) {
  const socketRef = useRef(null);
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const startingRef = useRef(false);
  const pendingCandidatesRef = useRef(new Map());
  const remoteStreamRef = useRef(new MediaStream());
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peerConsented, setPeerConsented] = useState(false);
  const [recording, setRecording] = useState(false);
  const [consented, setConsented] = useState(false);

  const sendSignal = useCallback((peerId, signal) => {
    socketRef.current?.emit("video:signal", { peerId, signal });
  }, []);

  const createPeer = useCallback(
    (peerId, initiator, stream) => {
      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.onicecandidate = ({ candidate }) => {
        if (candidate) sendSignal(peerId, { candidate });
      };
      peer.ontrack = ({ track, streams }) => {
        const remoteStream = streams[0] || remoteStreamRef.current;
        if (!remoteStream.getTrackById(track.id)) {
          remoteStream.addTrack(track);
        }
        remoteStreamRef.current = remoteStream;
        setRemoteStream(remoteStream);
      };
      peer.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(peer.connectionState)) {
          peer.close();
          peersRef.current.delete(peerId);
          setRemoteStream(null);
          setStatus("waiting");
        }
      };
      peersRef.current.set(peerId, peer);

      if (initiator) {
        peer.createOffer()
          .then((offer) => peer.setLocalDescription(offer).then(() => offer))
          .then((offer) => sendSignal(peerId, { description: offer }))
          .catch((callError) => setError(callError.message));
      }
      return peer;
    },
    [sendSignal],
  );

  const start = useCallback(async () => {
    if (!roomId || !token || localStreamRef.current || startingRef.current) return;
    startingRef.current = true;
    try {
      setError("");
      const mediaDevices = requireMediaDevices();
      const stream = await mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const socket = io(SOCKET_URL, { auth: { token } });
      socketRef.current = socket;
      socket.on("connect", () => {
        setStatus("waiting");
        socket.emit("video:join", { roomId });
      });
      socket.on("disconnect", (reason) => {
        if (reason !== "io client disconnect") {
          setStatus("reconnecting");
          setError("Video connection interrupted. Reconnecting...");
        }
      });
      socket.io.on("reconnect", () => {
        setError("");
        setStatus("waiting");
        socket.emit("video:join", { roomId });
      });
      socket.on("video:peers", (peerIds) => {
        peerIds.forEach((peerId) => createPeer(peerId, true, stream));
        if (peerIds.length) setStatus("connecting");
      });
      socket.on("video:peer-joined", ({ peerId }) => {
        createPeer(peerId, false, stream);
        setStatus("connecting");
      });
      socket.on("video:signal", async ({ peerId, signal }) => {
        try {
          let peer = peersRef.current.get(peerId);
          if (!peer) peer = createPeer(peerId, false, stream);
          if (signal.description) {
            await peer.setRemoteDescription(signal.description);
            const pending = pendingCandidatesRef.current.get(peerId) || [];
            for (const candidate of pending) {
              await peer.addIceCandidate(candidate);
            }
            pendingCandidatesRef.current.delete(peerId);
            if (signal.description.type === "offer") {
              const answer = await peer.createAnswer();
              await peer.setLocalDescription(answer);
              sendSignal(peerId, { description: answer });
            }
          } else if (signal.candidate) {
            if (peer.remoteDescription) {
              await peer.addIceCandidate(signal.candidate);
            } else {
              const candidates = pendingCandidatesRef.current.get(peerId) || [];
              candidates.push(signal.candidate);
              pendingCandidatesRef.current.set(peerId, candidates);
            }
          }
          setStatus("connected");
        } catch (signalError) {
          console.error("Video signaling failed", signalError);
          setError("The video connection could not negotiate. Try leaving and joining again.");
          setStatus("error");
        }
      });
      socket.on("video:peer-left", ({ peerId }) => {
        peersRef.current.get(peerId)?.close();
        peersRef.current.delete(peerId);
        setRemoteStream(null);
        setPeerConsented(false);
        setStatus("waiting");
      });
      socket.on("video:recording-consent", ({ consented: peerConsent }) => {
        setPeerConsented(peerConsent);
      });
      socket.on("video:error", ({ message }) => {
        setError(message || "Could not join the video call.");
        setStatus("error");
      });
      socket.on("connect_error", (connectError) => {
        console.error("Video socket connection failed", connectError);
        setError(`Video connection failed: ${connectError.message}`);
        setStatus("error");
      });
    } catch (startError) {
      console.error("Could not start video call", startError);
      const message =
        startError.name === "NotAllowedError"
          ? "Camera or microphone permission was denied. Allow access in the browser and retry."
          : startError.name === "NotFoundError"
            ? "No camera or microphone was found on this device."
            : startError.message || "Camera and microphone access is required.";
      setError(message);
      setStatus("error");
    } finally {
      startingRef.current = false;
    }
  }, [createPeer, roomId, sendSignal, token]);

  const stop = useCallback(() => {
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();
    socketRef.current?.disconnect();
    socketRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = new MediaStream();
    setStatus("idle");
    setPeerConsented(false);
    setConsented(false);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    startingRef.current = false;
  }, []);

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCameraOff(!track.enabled);
  };

  const shareScreen = async () => {
    if (!localStreamRef.current) return;
    if (!isScreenSharing) {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setError("Screen sharing requires HTTPS or localhost.");
        return;
      }
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      peersRef.current.forEach((peer) => {
        const sender = peer.getSenders().find(({ track }) => track?.kind === "video");
        sender?.replaceTrack(screenTrack);
      });
      screenTrack.onended = () => shareScreen();
      setIsScreenSharing(true);
    } else {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      peersRef.current.forEach((peer) => {
        const sender = peer.getSenders().find(({ track }) => track?.kind === "video");
        sender?.replaceTrack(cameraTrack);
      });
      setIsScreenSharing(false);
    }
  };

  const selectDevice = async (kind, deviceId) => {
    const current = localStreamRef.current;
    if (!current) return;
    const replacement = await requireMediaDevices().getUserMedia({
      [kind]: { deviceId: { exact: deviceId } },
    });
    const newTrack = replacement.getTracks()[0];
    const oldTrack = current.getTracks().find((track) => track.kind === kind);
    peersRef.current.forEach((peer) => {
      const sender = peer.getSenders().find(({ track }) => track?.kind === kind);
      sender?.replaceTrack(newTrack);
    });
    oldTrack?.stop();
    current.addTrack(newTrack);
    setLocalStream(current);
  };

  const setRecordingConsent = (nextConsented) => {
    setConsented(nextConsented);
    socketRef.current?.emit("video:recording-consent", { consented: nextConsented });
  };

  const startRecording = () => {
    if (!consented || !peerConsented || !localStreamRef.current || recording) return;
    const tracks = [
      ...localStreamRef.current.getTracks(),
      ...(remoteStream?.getTracks() || []),
    ];
    const mimeType = ["video/webm;codecs=vp9,opus", "video/webm"]
      .find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) {
      setError("This browser does not support local call recording.");
      return;
    }
    const recorder = new MediaRecorder(new MediaStream(tracks), { mimeType });
    recordedChunksRef.current = [];
    recorder.ondataavailable = ({ data }) => data.size && recordedChunksRef.current.push(data);
    recorder.onstop = () => {
      const url = URL.createObjectURL(new Blob(recordedChunksRef.current, { type: "video/webm" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `syncscript-call-${new Date().toISOString()}.webm`;
      link.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  useEffect(() => stop, [stop]);

  return {
    username,
    localStream,
    remoteStream,
    status,
    error,
    isMuted,
    isCameraOff,
    isScreenSharing,
    recording,
    consented,
    peerConsented,
    start,
    stop,
    toggleMute,
    toggleCamera,
    shareScreen,
    selectDevice,
    setRecordingConsent,
    startRecording,
    stopRecording,
  };
}
