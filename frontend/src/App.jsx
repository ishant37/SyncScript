import "./App.css";

import { useMemo, useState } from "react";
import * as Y from "yjs";

import LandingPage from "../components/LandingPage";
import RoomSidebar from "../components/RoomSidebar";
import CodeEditor from "../components/CodeEditor";

import { useRoomNavigation } from "../hooks/useRoomNavigation";
import { useCollaboration } from "../hooks/useCollaboration";
import { useMonacoBinding } from "../hooks/useMonacoBinding";

import {
  createRoom,
  joinRoom,
} from "../services/roomService";

import { getFormValues } from "../utils/roomUtils";

function App() {
  const {
    roomId,
    username,
    navigateToRoom,
  } = useRoomNavigation();

  const [users, setUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] =
    useState("disconnected");

  const [errorMessage, setErrorMessage] =
    useState("");

  // Yjs document
  const ydoc = useMemo(
    () => new Y.Doc({
      guid: roomId || undefined,
    }),
    [roomId]
  );

  const yText = useMemo(
    () => ydoc.getText("monaco"),
    [ydoc]
  );

  // Monaco binding
  const { handleMount } =
    useMonacoBinding(yText);

  // Socket collaboration
  useCollaboration({
    roomId,
    username,
    ydoc,
    setUsers,
    setConnectionStatus,
  });

  // Create room
  const handleCreateRoom = async (event) => {
    event.preventDefault();

    const {
      username: nextUsername,
    } = getFormValues(event);

    if (!nextUsername) {
      setErrorMessage(
        "Enter a display name first."
      );

      return;
    }

    try {
      const room = await createRoom();

      navigateToRoom(
        room.roomId,
        nextUsername
      );

      setErrorMessage("");
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Could not create a room. Is the backend running?"
      );
    }
  };

  // Join room
  const handleJoinRoom = async (event) => {
    event.preventDefault();

    const {
      username: nextUsername,
      roomId: nextRoomId,
    } = getFormValues(event);

    if (!nextUsername || !nextRoomId) {
      setErrorMessage(
        "Enter both a display name and room ID."
      );

      return;
    }

    try {
      const room = await joinRoom(nextRoomId);

      navigateToRoom(
        room.roomId,
        nextUsername
      );

      setErrorMessage("");
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error.message ||
          "Could not join the room. Is the backend running?"
      );
    }
  };

  const handleSubmit = (event) => {
    if (
      event.nativeEvent.submitter?.value ===
      "create"
    ) {
      return handleCreateRoom(event);
    }

    return handleJoinRoom(event);
  };

  // Landing page
  if (!roomId || !username) {
    return (
      <LandingPage
        username={username}
        roomId={roomId}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    );
  }

  // Room page
  return (
    <main className="flex h-screen w-full flex-col gap-4 bg-[#09090b] p-4 text-white md:flex-row">
      <RoomSidebar
        roomId={roomId}
        username={username}
        users={users}
        connectionStatus={connectionStatus}
      />

      <CodeEditor
        username={username}
        onMount={handleMount}
      />
    </main>
  );
}

export default App;