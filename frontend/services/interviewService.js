import { apiRequest } from "./api";

export async function listInterviews() {
  const data = await apiRequest("/api/interviews");
  return data.interviews;
}

export async function scheduleInterview(payload) {
  const data = await apiRequest("/api/interviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.interview;
}

export async function joinInterview(id) {
  const data = await apiRequest(`/api/interviews/${id}/join`, {
    method: "POST",
  });
  return data.interview;
}
