import { apiRequest } from "./api";

export async function createRoom(name) {
  const data = await apiRequest("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return data.room;
}

export async function joinRoom(roomId) {
  const data = await apiRequest(
    `/api/rooms/${encodeURIComponent(roomId)}`
  );
  return data.room;
}