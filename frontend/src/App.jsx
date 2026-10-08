import "./App.css";

import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";

import AuthPage from "../components/AuthPage";
import LandingPage from "../components/LandingPage";
import RoomSidebar from "../components/RoomSidebar";
import CodeEditor from "../components/CodeEditor";
import { useRoomNavigation } from "../hooks/useRoomNavigation";
import { useCollaboration } from "../hooks/useCollaboration";
import { useMonacoBinding } from "../hooks/useMonacoBinding";
import { createRoom, joinRoom } from "../services/roomService";
import {
  getCurrentUser,
  logoutUser,
} from "../services/authService";
import { getStoredToken } from "../services/api";

function App() {
  const { roomId, navigateToRoom } = useRoomNavigation();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(getStoredToken()));
  const [users, setUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [errorMessage, setErrorMessage] = useState("");
  const token = getStoredToken();

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => {
        logoutUser();
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, [token]);

  const ydoc = useMemo(
    () => new Y.Doc({ guid: roomId || undefined }),
    [roomId],
  );
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);
  const { handleMount } = useMonacoBinding(yText);

  useCollaboration({
    roomId,
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
    window.history.pushState({}, "", "/");
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    const name = event.currentTarget.roomName.value.trim();

    try {
      const room = await createRoom(name || undefined);
      navigateToRoom(room.roomId, user.username);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Could not create a room.");
    }
  };

  const handleJoinRoom = async (event) => {
    event.preventDefault();
    const nextRoomId = event.currentTarget.roomId.value.trim();

    if (!nextRoomId) {
      setErrorMessage("Enter a room ID.");
      return;
    }

    try {
      const room = await joinRoom(nextRoomId);
      navigateToRoom(room.roomId, user.username);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Could not join the room.");
    }
  };

  const handleSubmit = (event) => {
    if (event.nativeEvent.submitter?.value === "create") {
      return handleCreateRoom(event);
    }
    return handleJoinRoom(event);
  };

  if (authLoading) {
    return <main className="min-h-screen bg-[#09090b]" />;
  }

  if (!user) {
    return <AuthPage onAuthenticated={setUser} />;
  }

  if (!roomId) {
    return (
      <LandingPage
        roomId={roomId}
        user={user}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <main className="flex h-screen w-full flex-col gap-4 bg-[#09090b] p-4 text-white md:flex-row">
      <RoomSidebar
        roomId={roomId}
        username={user.username}
        users={users}
        connectionStatus={connectionStatus}
        onLogout={handleLogout}
      />
      <CodeEditor username={user.username} onMount={handleMount} />
    </main>
  );
}

export default App;
