import "./App.css";

import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";

import AuthPage from "../components/AuthPage";
import LandingPage from "../components/LandingPage";
import InterviewerDashboard from "../components/InterviewerDashboard";
import StudentDashboard from "../components/StudentDashboard";
import RoomSidebar from "../components/RoomSidebar";
import CodeEditor from "../components/CodeEditor";
import VideoCall from "../components/VideoCall";
import { useRoomNavigation } from "../hooks/useRoomNavigation";
import { useCollaboration } from "../hooks/useCollaboration";
import { useMonacoBinding } from "../hooks/useMonacoBinding";
import { createRoom, getRoom, joinRoom } from "../services/roomService";
import { getCurrentUser, logoutUser } from "../services/authService";
import { getStoredToken } from "../services/api";

function App() {
  const { roomId, navigateToRoom, navigateToDashboard } = useRoomNavigation();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(getStoredToken()));
  const [users, setUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [errorMessage, setErrorMessage] = useState("");
  const [authorizedRoom, setAuthorizedRoom] = useState(null);
  const [roomError, setRoomError] = useState("");
  const [roomErrorRoomId, setRoomErrorRoomId] = useState("");
  const [roomAttempt, setRoomAttempt] = useState(0);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [showVideo, setShowVideo] = useState(true);
  const [editorLanguage, setEditorLanguage] = useState("javascript");
  const token = getStoredToken();
  const activeRoomId = authorizedRoom?.roomId === roomId ? roomId : "";

  useEffect(() => {
    if (!token) {
      return undefined;
    }
    let active = true;
    getCurrentUser()
      .then((currentUser) => active && setUser(currentUser))
      .catch((error) => {
        console.error("Session restoration failed", error);
        logoutUser();
        if (active) {
          setUser(null);
          setErrorMessage(error.message || "Your session expired. Please sign in again.");
        }
      })
      .finally(() => active && setAuthLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!user || !roomId) {
      return undefined;
    }
    let active = true;
    getRoom(roomId)
      .then((room) => {
        if (active) {
          setAuthorizedRoom(room);
        }
      })
      .catch((error) => {
        console.error("Room authorization failed", error);
        if (active) {
          setRoomError(error.message || "You do not have access to that room.");
          setRoomErrorRoomId(roomId);
        }
      });
    return () => {
      active = false;
    };
  }, [roomId, user, roomAttempt]);

  const ydoc = useMemo(() => new Y.Doc({ guid: activeRoomId || undefined }), [activeRoomId]);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);
  const { handleMount } = useMonacoBinding(yText);

  useCollaboration({
    roomId: activeRoomId,
    username: user?.username,
    token,
    ydoc,
    setUsers,
    setConnectionStatus,
  });

  useEffect(() => () => ydoc.destroy(), [ydoc]);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setUsers([]);
    setAuthorizedRoom(null);
    setCreatedRoom(null);
    navigateToDashboard();
  };

  const handleAuthenticated = (authenticatedUser) => {
    setUser(authenticatedUser);
    setErrorMessage("");
    navigateToDashboard();
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    try {
      const room = await createRoom(event.currentTarget.roomName.value.trim() || undefined);
      setCreatedRoom(room);
      setErrorMessage("");
    } catch (error) {
      console.error("Room creation failed", error);
      setErrorMessage(error.message || "Could not create a room.");
    }
  };

  const handleJoinRoom = async (event) => {
    event.preventDefault();
    const nextRoomId = event.currentTarget.roomId.value.trim();
    const passcode = event.currentTarget.passcode.value.trim();
    if (!nextRoomId || !passcode) {
      setErrorMessage("Enter both a room ID and passcode.");
      return;
    }
    try {
      const room = await joinRoom(nextRoomId, passcode);
      setAuthorizedRoom(room);
      navigateToRoom(room.roomId);
      setErrorMessage("");
    } catch (error) {
      console.error("Room join failed", error);
      setErrorMessage(error.message || "Could not join the room.");
    }
  };

  if (authLoading) return <LoadingScreen message="Restoring your SyncScript session..." />;
  if (!user) return <AuthPage onAuthenticated={handleAuthenticated} initialError={errorMessage} />;

  const currentRoomError = roomErrorRoomId === roomId ? roomError : "";
  if (roomId && (!authorizedRoom || authorizedRoom.roomId !== roomId)) {
    return (
      <LoadingScreen
        message={currentRoomError ? "Unable to open this room" : "Checking room access..."}
        error={currentRoomError}
        actionLabel="Return to dashboard"
        onAction={navigateToDashboard}
        secondaryLabel={currentRoomError ? "Try again" : ""}
        onSecondary={() => {
          setRoomError("");
          setRoomErrorRoomId("");
          setAuthorizedRoom(null);
          setRoomAttempt((attempt) => attempt + 1);
        }}
      />
    );
  }

  if (!roomId) {
    const dashboardProps = {
      user,
      onLogout: handleLogout,
      onOpenRoom: (nextRoomId) => navigateToRoom(nextRoomId),
    };
    return (
      <>
        {user.role === "interviewer" ? <InterviewerDashboard {...dashboardProps} /> : <StudentDashboard {...dashboardProps} />}
        <LandingPage
          roomId={roomId}
          user={user}
          errorMessage={errorMessage}
          onSubmit={(event) => event.currentTarget.roomName ? handleCreateRoom(event) : handleJoinRoom(event)}
          onLogout={handleLogout}
          createdRoom={createdRoom}
          onOpenCreatedRoom={() => navigateToRoom(createdRoom.roomId)}
        />
      </>
    );
  }

  return (
    <main className="ide-shell flex h-screen w-full flex-col overflow-hidden bg-[#09090b] text-white">
      <header className="flex min-h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#18181b] px-4">
        <span className="text-sm font-bold tracking-wide text-violet-300">SyncScript</span>
        <span className="hidden text-zinc-600 sm:inline">/</span>
        <span className="truncate text-sm text-zinc-300">{authorizedRoom.name || "Live room"}</span>
        <span className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-zinc-400">{roomId}</span>
        <button type="button" className="toolbar-button" onClick={() => navigator.clipboard?.writeText(roomId)}>Copy ID</button>
        <button type="button" className="toolbar-button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy link</button>
        <span className="ml-auto hidden text-xs text-zinc-400 sm:inline">{users.length} participant{users.length === 1 ? "" : "s"} · {connectionStatus}</span>
        <select aria-label="Editor language" value={editorLanguage} onChange={(event) => setEditorLanguage(event.target.value)} className="hidden rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 sm:block">
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="json">JSON</option>
        </select>
        <button type="button" className="toolbar-button" onClick={() => setShowVideo((current) => !current)}>{showVideo ? "Hide video" : "Video"}</button>
        <button type="button" className="toolbar-button" onClick={navigateToDashboard}>Leave room</button>
      </header>
      <div className="room-layout workspace-body flex min-h-0 flex-1 gap-3 p-3">
        <RoomSidebar roomId={roomId} username={user.username} users={users} connectionStatus={connectionStatus} onLogout={handleLogout} onLeave={navigateToDashboard} />
        <div className="room-main workspace-panels flex min-w-0 flex-1 gap-3">
          {showVideo && <VideoCall roomId={activeRoomId} token={token} />}
          <div className="editor-panel flex min-w-0 flex-1 flex-col gap-3">
          <CodeEditor username={user.username} language={editorLanguage} onMount={handleMount} readOnly={authorizedRoom.role === "VIEWER"} />
          <div className="flex h-8 shrink-0 items-center rounded border border-white/10 bg-[#18181b] px-3 text-xs text-zinc-500">
            {authorizedRoom.role === "VIEWER" ? "Read-only viewer mode" : "Changes sync automatically"} · {connectionStatus}
          </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingScreen({ message, error, actionLabel, onAction, secondaryLabel, onSecondary }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] p-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        <h1 className="text-lg font-semibold">{message}</h1>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        {actionLabel && <div className="mt-6 flex justify-center gap-3"><button type="button" className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold" onClick={onAction}>{actionLabel}</button>{secondaryLabel && <button type="button" className="rounded-lg border border-white/15 px-4 py-2 text-sm" onClick={onSecondary}>{secondaryLabel}</button>}</div>}
      </section>
    </main>
  );
}

export default App;
