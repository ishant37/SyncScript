// import React from 'react'

export default function RoomSidebar({
  roomId,
  username,
  users,
  connectionStatus,
}) {
  return (
    <aside className="flex w-full flex-col rounded-2xl border border-white/10 bg-zinc-900/80 md:w-72">
      <div className="border-b border-white/10 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300">
          SyncScript
        </p>

        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Live room
          </h2>

          <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-emerald-400"
                  : "bg-amber-300"
              }`}
            />

            {connectionStatus}
          </span>
        </div>

        <p className="mt-1 truncate text-xs text-zinc-500">
          {roomId}
        </p>
      </div>

      <div className="flex-1 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {users.length} online
        </p>

        <ul className="space-y-2">
          {users.map((user, index) => (
            <li
              key={`${user.username}-${index}`}
              className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200">
                {user.username
                  .slice(0, 1)
                  .toUpperCase()}
              </span>

              <span className="truncate text-sm">
                {user.username}
                {user.username === username
                  ? " (you)"
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
