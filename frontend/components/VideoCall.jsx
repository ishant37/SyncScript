import { useEffect, useRef, useState } from "react";
import { useVideoCall } from "../hooks/useVideoCall";

function Video({ stream, muted, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs">{label}</span>
    </div>
  );
}

export default function VideoCall({ roomId, token }) {
  const [devices, setDevices] = useState([]);
  const call = useVideoCall({ roomId, token });

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices()
      .then(setDevices)
      .catch((error) => console.error("Could not enumerate media devices", error));
  }, [call.localStream]);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Video call</h2>
          <p className="text-xs text-zinc-400">{call.status}</p>
        </div>
        {call.recording && <span className="text-xs font-semibold text-red-400">● Recording locally</span>}
      </div>
      {call.error && <p className="mb-3 rounded-lg bg-red-500/10 p-2 text-xs text-red-300">{call.error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Video stream={call.localStream} muted label="You" />
        <Video stream={call.remoteStream} label="Participant" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {call.status === "idle" || call.status === "error" ? (
          <button onClick={call.start} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold">Join call</button>
        ) : (
          <button onClick={call.stop} className="rounded-lg bg-zinc-700 px-3 py-2 text-xs">Leave</button>
        )}
        <button onClick={call.toggleMute} disabled={!call.localStream} className="rounded-lg bg-zinc-800 px-3 py-2 text-xs">{call.isMuted ? "Unmute" : "Mute"}</button>
        <button onClick={call.toggleCamera} disabled={!call.localStream} className="rounded-lg bg-zinc-800 px-3 py-2 text-xs">{call.isCameraOff ? "Camera on" : "Camera off"}</button>
        <button onClick={call.shareScreen} disabled={!call.localStream} className="rounded-lg bg-zinc-800 px-3 py-2 text-xs">{call.isScreenSharing ? "Stop sharing" : "Share screen"}</button>
      </div>
      {call.localStream && (
        <div className="mt-3 flex flex-wrap gap-2">
          {devices.filter((device) => device.kind === "videoinput").length > 0 && (
            <select onChange={(event) => call.selectDevice("video", event.target.value)} className="rounded-lg bg-zinc-800 px-2 py-2 text-xs">
              <option>Camera</option>
              {devices.filter((device) => device.kind === "videoinput").map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label || "Camera"}</option>)}
            </select>
          )}
          {devices.filter((device) => device.kind === "audioinput").length > 0 && (
            <select onChange={(event) => call.selectDevice("audio", event.target.value)} className="rounded-lg bg-zinc-800 px-2 py-2 text-xs">
              <option>Microphone</option>
              {devices.filter((device) => device.kind === "audioinput").map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label || "Microphone"}</option>)}
            </select>
          )}
        </div>
      )}
      {call.remoteStream && (
        <div className="mt-4 rounded-lg border border-white/10 p-3 text-xs text-zinc-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={call.consented} onChange={(event) => call.setRecordingConsent(event.target.checked)} />
            I consent to recording this call locally. The other participant must also consent.
          </label>
          <div className="mt-2 flex gap-2">
            <button onClick={call.startRecording} disabled={!call.consented || !call.peerConsented || call.recording} className="rounded bg-red-600 px-2 py-1 disabled:opacity-40">Start recording</button>
            <button onClick={call.stopRecording} disabled={!call.recording} className="rounded bg-zinc-700 px-2 py-1 disabled:opacity-40">Stop and download</button>
          </div>
        </div>
      )}
    </section>
  );
}
