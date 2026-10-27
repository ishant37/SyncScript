import { useCallback, useEffect, useState } from "react";
import {
  getRoomIdFromPath,
  getUsernameFromUrl,
} from "../utils/roomUtils";

export function useRoomNavigation() {
  const [roomId, setRoomId] = useState(getRoomIdFromPath);
  const [username, setUsername] = useState(getUsernameFromUrl);

  useEffect(() => {
    const handlePopState = () => {
      setRoomId(getRoomIdFromPath());
      setUsername(getUsernameFromUrl());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigateToRoom = useCallback((nextRoomId) => {
    window.history.pushState({}, "", `/room/${encodeURIComponent(nextRoomId)}`);

    setRoomId(nextRoomId);
    setUsername("");
  }, []);

  const navigateToDashboard = useCallback(() => {
    window.history.pushState({}, "", "/");
    setRoomId("");
    setUsername("");
  }, []);

  return {
    roomId,
    username,
    navigateToRoom,
    navigateToDashboard,
  };
}