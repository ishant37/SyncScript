import { useEffect, useState } from "react";
import { joinInterview, listInterviews } from "../services/interviewService";
import { DashboardShell } from "./InterviewerDashboard";

export default function StudentDashboard({ user, onOpenRoom, onLogout }) {
  const [interviews, setInterviews] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    listInterviews()
      .then(setInterviews)
      .catch((error) => setErrorMessage(error.message));
  }, []);

  const handleJoin = async (id) => {
    try {
      const interview = await joinInterview(id);
      onOpenRoom(interview.roomId);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <DashboardShell title={`Welcome back, ${user.username}`} onLogout={onLogout}>
      <section className="dashboard-card">
        <div className="section-heading"><div><p className="eyebrow">Your schedule</p><h2>Upcoming interviews</h2></div><span className="section-badge">{interviews.length} total</span></div>
        {errorMessage && <p className="mt-3 text-sm text-red-300">{errorMessage}</p>}
        <div className="mt-4 space-y-3">
          {!interviews.length && <p className="text-zinc-500">No interview invitations yet.</p>}
          {interviews.map((interview) => (
            <article key={interview._id} className="interview-row">
              <h3 className="font-semibold">{interview.title}</h3>
              <p className="text-sm text-zinc-400">
                {new Date(interview.scheduledAt).toLocaleString()} · {interview.durationMinutes} minutes
              </p>
              <p className="mt-1 text-sm text-zinc-400">{interview.status}</p>
              <button onClick={() => handleJoin(interview._id)} className="mt-3 rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold">
                Join interview
              </button>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
