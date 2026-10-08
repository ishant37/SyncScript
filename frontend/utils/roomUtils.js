export function getRoomIdFromPath() {
  const match = window.location.pathname.match(/^\/room\/([^/]+)$/);

  return match ? decodeURIComponent(match[1]) : "";
}

export function getUsernameFromUrl() {
  return new URLSearchParams(window.location.search).get("username") || "";
}

export function getFormValues(event) {
  return {
    username: event.currentTarget.username.value.trim(),
    roomId: event.currentTarget.roomId.value.trim(),
  };
}