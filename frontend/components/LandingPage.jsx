export default function LandingPage({
  username,
  roomId,
  errorMessage,
  onSubmit,
}) {
  return (
    <main className="min-h-screen w-full bg-[#09090b] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-zinc-950 to-zinc-950 p-8 shadow-2xl">
        <div className="w-full max-w-md">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
            SyncScript
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Collaborate in real time.
          </h1>

          <p className="mt-4 text-zinc-400">
            Create a room or join an existing one to start
            editing together.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-3"
          >
            <input
              name="username"
              type="text"
              placeholder="Your display name"
              defaultValue={username}
              maxLength={32}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-violet-400"
            />

            <input
              name="roomId"
              type="text"
              placeholder="Room ID to join"
              defaultValue={roomId}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-violet-400"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                value="join"
                className="flex-1 rounded-xl border border-white/15 px-4 py-3 font-semibold transition hover:bg-white/10"
              >
                Join room
              </button>

              <button
                type="submit"
                value="create"
                className="flex-1 rounded-xl bg-violet-500 px-4 py-3 font-semibold transition hover:bg-violet-400"
              >
                Create room
              </button>
            </div>
          </form>

          {errorMessage && (
            <p className="mt-4 text-sm text-red-300">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}