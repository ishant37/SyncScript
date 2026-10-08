import { useEffect, useState } from "react";
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

  const navigateToRoom = (nextRoomId, nextUsername) => {
    const search = new URLSearchParams({
      username: nextUsername,
    });

    window.history.pushState(
      {},
      "",
      `/room/${nextRoomId}?${search}`
    );

    setRoomId(nextRoomId);
    setUsername(nextUsername);
  };

  return {
    roomId,
    username,
    navigateToRoom,
  };
}