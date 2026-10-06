import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from "react"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

const ROOM_NAME = "monaco"
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin)

function App() {
  const editorRef = useRef(null)
  const bindingRef = useRef(null)
  const [ username, setUsername ] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  })
  const [ users, setUsers ] = useState([])
  const [ connectionStatus, setConnectionStatus ] = useState("connecting")
  const [ syncError, setSyncError ] = useState("")

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText(ROOM_NAME), [ ydoc ])

  const handleMount = (editor) => {
    editorRef.current = editor

    bindingRef.current = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([ editorRef.current ]),
    )
  }

  const handleJoin = (e) => {
    e.preventDefault()
    const nextUsername = e.target.username.value.trim()
    if (!nextUsername) return

    setUsername(nextUsername)
    window.history.pushState(
      {},
      "",
      `?${new URLSearchParams({ username: nextUsername })}`,
    )
  }

  useEffect(() => {
    if (!username) return undefined

    setConnectionStatus("connecting")
    setSyncError("")

    const provider = new SocketIOProvider(SOCKET_URL, ROOM_NAME, ydoc, {
      autoConnect: true,
    })

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values())
      const connectedUsers = states
        .filter((state) => state.user?.username)
        .map((state) => state.user)
      setUsers(connectedUsers)
    }

    const handleStatus = ({ status }) => {
      setConnectionStatus(status)
      if (status === "connected") setSyncError("")
    }

    const handleConnectionError = (error) => {
      setConnectionStatus("disconnected")
      setSyncError(`Unable to connect to the collaboration server at ${SOCKET_URL}.`)
      console.error("Collaboration connection failed", error)
    }

    provider.awareness.setLocalStateField("user", { username })
    provider.on("status", handleStatus)
    provider.on("connection-error", handleConnectionError)
    provider.awareness.on("change", updateUsers)
    updateUsers()

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField("user", null)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      provider.awareness.off("change", updateUsers)
      provider.off("status", handleStatus)
      provider.off("connection-error", handleConnectionError)
      provider.awareness.setLocalStateField("user", null)
      provider.disconnect()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [ username, ydoc ])

  useEffect(() => () => {
    bindingRef.current?.destroy()
    ydoc.destroy()
  }, [ ydoc ])

  if (!username) {
    return (
      <main className="min-h-screen w-full bg-[#09090b] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-zinc-950 to-zinc-950 p-8 shadow-2xl">
          <div className="w-full max-w-md">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">SyncScript</p>
            <h1 className="text-4xl font-bold tracking-tight">Collaborate in real time.</h1>
            <p className="mt-4 text-zinc-400">Open the same room in another tab and see every edit and teammate instantly.</p>
            <form onSubmit={handleJoin} className="mt-8 flex gap-3">
              <input
                type="text"
                placeholder="Your display name"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                name="username"
                autoFocus
                maxLength={32}
              />
              <button className="rounded-xl bg-violet-500 px-5 py-3 font-semibold transition hover:bg-violet-400">
                Join room
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex h-screen w-full flex-col gap-4 bg-[#09090b] p-4 text-white md:flex-row">
      <aside className="flex w-full flex-col rounded-2xl border border-white/10 bg-zinc-900/80 md:w-72">
        <div className="border-b border-white/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300">SyncScript</p>
          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Live room</h2>
            <span className={`flex items-center gap-2 text-xs font-medium ${connectionStatus === "connected" ? "text-emerald-400" : "text-amber-300"}`}>
              <span className={`h-2 w-2 rounded-full ${connectionStatus === "connected" ? "bg-emerald-400" : "bg-amber-300"}`} />
              {connectionStatus}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-zinc-500">Room: {ROOM_NAME}</p>
        </div>
        <div className="flex-1 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{users.length} online</p>
          <ul className="space-y-2">
            {users.map((user, index) => (
              <li key={`${user.username}-${index}`} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200">
                  {user.username.slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate text-sm">{user.username}{user.username === username ? " (you)" : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1e]">
        <div className="flex min-h-14 items-center justify-between border-b border-white/10 bg-zinc-900 px-5">
          <div>
            <p className="font-medium">index.js</p>
            <p className="text-xs text-zinc-500">Changes sync automatically</p>
          </div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">{username}</span>
        </div>
        {syncError && <div className="bg-red-950/70 px-5 py-2 text-sm text-red-200">{syncError}</div>}
        <div className="min-h-0 flex-1">
          <Editor height="100%" defaultLanguage="javascript" defaultValue="// Start writing together..." theme="vs-dark" onMount={handleMount} options={{ minimap: { enabled: false }, padding: { top: 16 } }} />
        </div>
      </section>
    </main>
  )
}

export default App