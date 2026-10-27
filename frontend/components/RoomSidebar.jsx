export default function RoomSidebar({ roomId, username, users, connectionStatus, onLogout, onLeave }) {
  return (
    <aside className="room-sidebar flex max-h-64 w-full shrink-0 flex-col rounded-xl border border-white/10 bg-zinc-900/80">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Explorer</h2>
          <span className="flex items-center gap-2 text-xs text-zinc-400"><span className={`h-2 w-2 rounded-full ${connectionStatus === "connected" ? "bg-emerald-400" : "bg-amber-300"}`} />{connectionStatus}</span>
        </div>
        <p className="mt-4 text-xs uppercase tracking-wider text-zinc-500">Shared files</p>
        <div className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-200">index.js</div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <p className="mb-3 text-xs uppercase tracking-wider text-zinc-500">{users.length} online</p>
        <ul className="space-y-2">{users.map((item, index) => <li key={`${item.username}-${index}`} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-2 text-sm"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-200">{item.username.slice(0, 1).toUpperCase()}</span><span className="truncate">{item.username}{item.username === username ? " (you)" : ""}</span></li>)}</ul>
        {!users.length && <p className="text-xs text-zinc-500">Waiting for participants...</p>}
      </div>
      <div className="border-t border-white/10 p-3"><button type="button" onClick={onLeave} className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/5">Leave workspace</button><button type="button" onClick={onLogout} className="mt-2 px-3 text-xs text-zinc-500 hover:text-white">Log out</button></div>
      <span className="sr-only">{roomId}</span>
    </aside>
  );
}
