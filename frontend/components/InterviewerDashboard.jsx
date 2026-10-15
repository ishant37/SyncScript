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
    <DashboardShell title={`Welcome, ${user.username}`} onLogout={onLogout}>
      <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5">
        <h2 className="text-xl font-semibold">Schedule an interview</h2>
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
    <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5">
      <h2 className="text-xl font-semibold">Your interviews</h2>
      <div className="mt-4 space-y-3">
        {!interviews.length && <p className="text-zinc-500">No interviews scheduled yet.</p>}
        {interviews.map((interview) => (
          <article key={interview._id} className="rounded-xl bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
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
    <main className="min-h-screen w-full bg-[#09090b] p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{title}</h1>
          <button onClick={onLogout} className="text-sm text-zinc-400 hover:text-white">Log out</button>
        </header>
        {children}
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
