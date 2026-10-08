import { useEffect } from "react";
import { SocketIOProvider } from "y-socket.io";
import { SOCKET_URL } from "../config/config";

export function useCollaboration({
  roomId,
  username,
  token,
  ydoc,
  setUsers,
  setConnectionStatus,
}) {
  useEffect(() => {
    if (!roomId || !username || !token) {
      return undefined;
    }

    const provider = new SocketIOProvider(
      SOCKET_URL,
      roomId,
      ydoc,
      {
        autoConnect: true,
        auth: { token },
      }
    );

    const updateUsers = () => {
      const states = Array.from(
        provider.awareness.getStates().values()
      );

      setUsers(
        states
          .filter((state) => state.user?.username)
          .map((state) => state.user)
      );
    };

    const handleStatus = ({ status }) => {
      setConnectionStatus(status);
    };

    const handleConnectionError = (error) => {
      console.error(
        "Collaboration connection failed",
        error
      );

      setConnectionStatus("disconnected");
    };

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField(
        "user",
        null
      );
    };

    provider.awareness.setLocalStateField("user", {
      username,
    });

    provider.awareness.on("change", updateUsers);

    provider.on("status", handleStatus);

    provider.on(
      "connection-error",
      handleConnectionError
    );

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    updateUsers();

    return () => {
      provider.awareness.off(
        "change",
        updateUsers
      );

      provider.off("status", handleStatus);

      provider.off(
        "connection-error",
        handleConnectionError
      );

      provider.awareness.setLocalStateField(
        "user",
        null
      );

      provider.disconnect();

      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );

      setUsers([]);
    };
  }, [
    roomId,
    username,
    token,
    ydoc,
    setUsers,
    setConnectionStatus,
  ]);
}