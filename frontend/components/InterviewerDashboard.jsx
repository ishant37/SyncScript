import { useEffect, useState } from "react";
import {
  listInterviews,
  scheduleInterview,
} from "../services/interviewService";

const defaultTimeZone = "Asia/Kolkata";

export default function InterviewerDashboard({
  user,
  onOpenRoom,
  onLogout,
}) {
  const [interviews, setInterviews] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInterviews = () =>
    listInterviews().then(setInterviews).catch((error) => {
      setErrorMessage(error.message);
    });

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setErrorMessage("");
    setMessage("");
    try {
      const interview = await scheduleInterview({
        title: form.title.value.trim(),
        studentEmail: form.studentEmail.value.trim(),
        date: form.date.value,
        time: form.time.value,
        timeZone: form.timeZone.value,
        durationMinutes: Number(form.durationMinutes.value),
        topics: form.topics.value
          .split(",")
          .map((topic) => topic.trim())
          .filter(Boolean),
        instructions: form.instructions.value.trim(),
      });
      setInterviews((current) => [...current, interview]);
      form.reset();
      form.timeZone.value = defaultTimeZone;
      setMessage("Interview scheduled. The development invitation was prepared.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell title={`Welcome back, ${user.username}`} onLogout={onLogout}>
      <section className="dashboard-card schedule-card dashboard-section">
        <div className="section-heading"><div><p className="eyebrow">Interview room</p><h2>Schedule an interview</h2></div><span className="section-badge">New</span></div>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="title" required placeholder="Interview title" className="field" />
          <input name="studentEmail" required type="email" placeholder="Student email" className="field" />
          <input name="date" required type="date" className="field" />
          <input name="time" required type="time" className="field" />
          <select name="timeZone" defaultValue={defaultTimeZone} className="field">
            <option>Asia/Kolkata</option>
            <option>UTC</option>
            <option>America/New_York</option>
            <option>Europe/London</option>
          </select>
          <select name="durationMinutes" defaultValue="60" className="field">
            {[30, 45, 60, 90].map((duration) => (
              <option key={duration} value={duration}>{duration} minutes</option>
            ))}
          </select>
          <input name="topics" placeholder="Topics (comma separated)" className="field md:col-span-2" />
          <textarea name="instructions" placeholder="Instructions (optional)" className="field md:col-span-2" />
          <button disabled={isSubmitting} className="rounded-xl bg-violet-500 px-4 py-3 font-semibold disabled:opacity-60 md:col-span-2">
            {isSubmitting ? "Scheduling..." : "Schedule interview"}
          </button>
        </form>
      </section>
      <StatusMessage message={message} error={errorMessage} />
      <InterviewList interviews={interviews} onOpenRoom={onOpenRoom} />
    </DashboardShell>
  );
}

function InterviewList({ interviews, onOpenRoom }) {
  return (
    <section className="dashboard-card dashboard-section">
    <div className="section-heading"><div><p className="eyebrow">Upcoming</p><h2>Your interviews</h2></div><span className="section-badge">{interviews.length} total</span></div>
      <div className="mt-4 space-y-3">
        {!interviews.length && <p className="text-zinc-500">No interviews scheduled yet.</p>}
        {interviews.map((interview) => (
          <article key={interview._id} className="interview-row">
            <div className="interview-row-content flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{interview.title}</h3>
                <p className="text-sm text-zinc-400">{interview.studentEmail} · {interview.status}</p>
              </div>
              <button onClick={() => onOpenRoom(interview.roomId)} className="rounded-lg border border-white/15 px-3 py-2 text-sm">
                Open workspace
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DashboardShell({ title, onLogout, children }) {
  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="brand-lockup"><div className="brand-mark small">S</div><span>SyncScript</span></div>
          <div className="dashboard-title"><p className="eyebrow">Your workspace</p><h1>{title}</h1></div>
          <button onClick={onLogout} className="text-button">Sign out <span>↗</span></button>
        </header>
        <div className="dashboard-content">{children}</div>
      </div>
    </main>
  );
}

function StatusMessage({ message, error }) {
  return (
    <>
      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </>
  );
}
