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
import {
  createRoom,
  getRoom,
  joinRoom,
} from "../services/roomService";
import {
  getCurrentUser,
  logoutUser,
} from "../services/authService";
import { getStoredToken } from "../services/api";

function App() {
  const {
    roomId,
    navigateToRoom,
    navigateToDashboard,
  } = useRoomNavigation();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(getStoredToken()));
  const [users, setUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [errorMessage, setErrorMessage] = useState("");
  const [authorizedRoom, setAuthorizedRoom] = useState(null);
  const [createdRoom, setCreatedRoom] = useState(null);
  const token = getStoredToken();
  const activeRoomId = authorizedRoom?.roomId || "";

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

  useEffect(() => {
    if (!user || !roomId) {
      return undefined;
    }

    let active = true;

    getRoom(roomId)
      .then((room) => {
        if (active) {
          setAuthorizedRoom(room);
          setErrorMessage("");
        }
      })
      .catch((error) => {
        if (active) {
          setAuthorizedRoom(null);
          navigateToDashboard();
          setErrorMessage(
            error.message || "You do not have access to that room.",
          );
        }
      })

    return () => {
      active = false;
    };
  }, [roomId, user, navigateToDashboard]);

  const ydoc = useMemo(
    () => new Y.Doc({ guid: activeRoomId || undefined }),
    [activeRoomId],
  );
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
    setAuthorizedRoom(null);
    setCreatedRoom(null);
    setErrorMessage("");
    navigateToDashboard();
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    const name = event.currentTarget.roomName.value.trim();

    try {
      const room = await createRoom(name || undefined);
      setCreatedRoom(room);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
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
      navigateToRoom(room.roomId, user.username);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Could not join the room.");
    }
  };

  const handleSubmit = (event) => {
    if (event.currentTarget.roomName) {
      return handleCreateRoom(event);
    }
    return handleJoinRoom(event);
  };

  if (authLoading) {
    return <main className="min-h-screen bg-[#09090b]" />;
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  const roomAccessPending = Boolean(roomId && user && !authorizedRoom);

  if (!roomId || !authorizedRoom || roomAccessPending) {
    return (
      <LandingPage
        roomId={roomId}
        user={user}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onLogout={handleLogout}
        createdRoom={createdRoom}
        onOpenCreatedRoom={() => {
          setAuthorizedRoom(createdRoom);
          navigateToRoom(createdRoom.roomId, user.username);
        }}
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
      <CodeEditor
        username={user.username}
        onMount={handleMount}
        readOnly={authorizedRoom.role === "VIEWER"}
      />
    </main>
  );
}

export default App;
