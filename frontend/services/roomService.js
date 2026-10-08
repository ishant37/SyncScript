import { API_URL } from "../config/config";

export async function createRoom() {
  const response = await fetch(`${API_URL}/api/rooms`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Room creation failed");
  }

  const data = await response.json();

  return data.room;
}

export async function joinRoom(roomId) {
  const response = await fetch(
    `${API_URL}/api/rooms/${encodeURIComponent(roomId)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Room not found.");
  }

  return data.room;
}