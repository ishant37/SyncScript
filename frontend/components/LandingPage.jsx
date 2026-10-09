export default function LandingPage({
  roomId,
  errorMessage,
  onSubmit,
  user,
  onLogout,
  createdRoom,
  onOpenCreatedRoom,
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
          <p className="mt-3 text-sm text-zinc-500">
            Signed in as {user.username} ({user.email})
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-3">
            <input
              name="roomName"
              type="text"
              placeholder="New room name (optional)"
              maxLength={100}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-violet-400"
            />
            <button
              type="submit"
              value="create"
              className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold transition hover:bg-violet-400"
            >
              Create room
            </button>
          </form>

          {createdRoom && (
            <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm">
              <p className="font-semibold text-emerald-200">
                Room created. Share these details once:
              </p>
              <p className="mt-2 break-all text-zinc-300">
                Room ID: {createdRoom.roomId}
              </p>
              <p className="break-all text-zinc-300">
                Passcode: {createdRoom.passcode}
              </p>
              <button
                type="button"
                onClick={onOpenCreatedRoom}
                className="mt-3 rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-zinc-950"
              >
                Open room
              </button>
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="mt-6 space-y-3"
          >
            <input
              name="roomId"
              type="text"
              placeholder="Room ID to join"
              defaultValue={roomId || ""}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-violet-400"
            />
            <input
              name="passcode"
              type="password"
              placeholder="Room passcode"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-violet-400"
            />
            <button
              type="submit"
              value="join"
              className="w-full rounded-xl border border-white/15 px-4 py-3 font-semibold transition hover:bg-white/10"
            >
              Join room
            </button>
          </form>

          {errorMessage && (
            <p className="mt-4 text-sm text-red-300">
              {errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 text-sm text-zinc-400 hover:text-white"
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}