import { apiRequest } from "./api";

export async function createRoom(name) {
  const data = await apiRequest("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return { ...data.room, passcode: data.passcode };
}

export async function getRoom(roomId) {
  const data = await apiRequest(
    `/api/rooms/${encodeURIComponent(roomId)}`
  );
  return data.room;
}

export async function joinRoom(roomId, passcode) {
  const data = await apiRequest(
    `/api/rooms/${encodeURIComponent(roomId)}/join`,
    {
      method: "POST",
      body: JSON.stringify({ passcode }),
    }
  );
  return data.room;
}