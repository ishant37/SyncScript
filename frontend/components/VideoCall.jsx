
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  Circle,
  LoaderCircle,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  MonitorUp,
  PhoneOff,
  Radio,
  Settings2,
  ShieldCheck,
  UserRound,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { useVideoCall } from "../hooks/useVideoCall";

function VideoTile({
  stream,
  label,
  muted = false,
  isCameraOff = false,
  isLocal = false,
}) {
  const videoRef = useRef(null);
  const hasVideo = Boolean(stream) && !isCameraOff;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream || null;

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <div className="group relative aspect-video min-h-44 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-lg">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`h-full w-full object-cover ${
            isLocal ? "[transform:scaleX(-1)]" : ""
          }`}
        />
      ) : (
        <div className="flex h-full min-h-44 flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            {isCameraOff ? (
              <CameraOff className="h-7 w-7 text-zinc-400" />
            ) : (
              <UserRound className="h-8 w-8 text-zinc-400" />
            )}
          </div>
          <span className="text-sm text-zinc-400">
            {stream ? "Camera is off" : "Waiting for video"}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            {label}
          </span>
          {isLocal && (
            <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-300">
              YOU
            </span>
          )}
        </div>
        {!hasVideo && (
          <CameraOff className="h-4 w-4 text-zinc-400" />
        )}
      </div>

      {hasVideo && (
        <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur">
          <VideoIcon className="h-3.5 w-3.5 text-white" />
        </div>
      )}
    </div>
  );
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex min-w-[68px] flex-col items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "bg-red-600 text-white hover:bg-red-500"
          : active
            ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20"
            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

export default function VideoCall({ roomId, token }) {
  const [devices, setDevices] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const call = useVideoCall({ roomId, token });
  const { start } = call;

  useEffect(() => {
    if (roomId && token) {
      start();
    }
  }, [roomId, token, start]);

  useEffect(() => {
    let cancelled = false;

    async function loadDevices() {
      try {
        const mediaDevices = navigator.mediaDevices;
        if (!mediaDevices?.enumerateDevices) return;

        const list = await mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(list);
      } catch (error) {
        console.error("Could not enumerate media devices", error);
      }
    }

    loadDevices();

    return () => {
      cancelled = true;
    };
  }, [call.localStream]);

  const cameraDevices = devices.filter(
    (device) => device.kind === "videoinput"
  );
  const microphoneDevices = devices.filter(
    (device) => device.kind === "audioinput"
  );

  const connected = call.status === "connected";
  const starting = call.status === "idle" ||
    call.status === "connecting";

  return (
    <section className={`video-call ${isExpanded ? "video-call-expanded" : ""}`}>
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <VideoIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold tracking-tight">Live room</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Video conference
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
              connected
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : call.status === "error"
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : "border-white/10 bg-zinc-900 text-zinc-400"
            }`}
          >
            {starting ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Circle
                className={`h-2 w-2 fill-current ${
                  connected ? "text-emerald-400" : ""
                }`}
              />
            )}
            {call.status}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded((value) => !value)}
              aria-label={isExpanded ? "Exit full screen video" : "Expand video"}
              aria-pressed={isExpanded}
              className="rounded-lg border border-white/10 bg-zinc-900 p-2.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((value) => !value)}
              aria-label="Toggle device settings"
              aria-expanded={showSettings}
              className="rounded-lg border border-white/10 bg-zinc-900 p-2.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-3 sm:p-5">
        {/* Error feedback */}
        {call.error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
          >
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Unable to connect</p>
              <p className="mt-1 text-xs leading-relaxed text-red-200/80">
                {call.error}
              </p>
            </div>
            <button
              type="button"
              onClick={call.start}
              className="shrink-0 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/25"
            >
              Retry
            </button>
          </div>
        )}

        {/* Video grid */}
        <div className="video-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
          <VideoTile
            stream={call.localStream}
            label="You"
            muted
            isLocal
            isCameraOff={call.isCameraOff}
          />
          <VideoTile
            stream={call.remoteStream}
            label="Participant"
          />
        </div>

        {/* Call controls */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <ControlButton
              icon={call.isMuted ? MicOff : Mic}
              label={call.isMuted ? "Unmute" : "Mute"}
              active={call.isMuted}
              disabled={!call.localStream}
              onClick={call.toggleMute}
            />

            <ControlButton
              icon={call.isCameraOff ? CameraOff : Camera}
              label={call.isCameraOff ? "Camera on" : "Camera off"}
              active={call.isCameraOff}
              disabled={!call.localStream}
              onClick={call.toggleCamera}
            />

            <ControlButton
              icon={MonitorUp}
              label={call.isScreenSharing ? "Stop share" : "Share screen"}
              active={call.isScreenSharing}
              disabled={!call.localStream}
              onClick={call.shareScreen}
            />

            {call.status === "idle" || call.status === "error" ? (
              <ControlButton
                icon={VideoIcon}
                label="Join call"
                onClick={call.start}
              />
            ) : (
              <ControlButton
                icon={PhoneOff}
                label="Leave call"
                onClick={call.stop}
                danger
              />
            )}
          </div>
        </div>

        {/* Device settings */}
        {showSettings && (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Settings2 className="h-4 w-4 text-emerald-400" />
                Device settings
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Choose your preferred camera and microphone.
              </p>
            </div>

            <DeviceSelect
              label="Camera"
              devices={cameraDevices}
              disabled={!call.localStream}
              onChange={(id) => call.selectDevice("video", id)}
            />

            <DeviceSelect
              label="Microphone"
              devices={microphoneDevices}
              disabled={!call.localStream}
              onChange={(id) => call.selectDevice("audio", id)}
            />
          </div>
        )}

        {/* Recording panel */}
        {call.remoteStream && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                call.recording
                  ? "bg-red-500/10 text-red-400"
                  : "bg-zinc-800 text-zinc-400"
              }`}>
                {call.recording ? (
                  <Radio className="h-5 w-5 animate-pulse" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">
                    Local recording
                  </h3>
                  {call.recording && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-300">
                      <Circle className="h-1.5 w-1.5 fill-current" />
                      Recording
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Recording requires consent from both participants.
                  The recording is handled locally by this application.
                </p>
              </div>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <input
                type="checkbox"
                checked={call.consented}
                onChange={(event) =>
                  call.setRecordingConsent(event.target.checked)
                }
                className="mt-0.5 h-4 w-4 accent-emerald-500"
              />
              <span className="text-xs leading-relaxed text-zinc-300">
                I consent to recording this call locally. The other
                participant must also consent.
              </span>
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={call.startRecording}
                disabled={
                  !call.consented ||
                  !call.peerConsented ||
                  call.recording
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Circle className="h-2 w-2 fill-current" />
                Start recording
              </button>

              <button
                type="button"
                onClick={call.stopRecording}
                disabled={!call.recording}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                Stop & download
              </button>
            </div>

            {!call.peerConsented && (
              <p className="mt-3 text-xs text-amber-300/80">
                Waiting for the other participant's recording consent.
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-center gap-2 border-t border-white/10 px-4 py-3 text-[11px] text-zinc-500">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secure call controls
      </footer>
    </section>
  );
}

function DeviceSelect({ label, devices, disabled, onChange }) {
  const [selected, setSelected] = useState("");

  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-zinc-300">{label}</span>
      <div className="relative">
        <select
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value);
            onChange(event.target.value);
          }}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-white/10 bg-zinc-950 px-3 py-3 pr-10 text-sm text-zinc-200 outline-none transition focus:border-emerald-500/50 disabled:opacity-40"
        >
          <option value="">Default {label.toLowerCase()}</option>
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `${label} ${index + 1}`}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      </div>
    </label>
  );
}
