import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useEffect, useMemo, useRef, useState } from "react"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL

function getRoomIdFromPath() {
  const match = window.location.pathname.match(/^\/room\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : ""
}

function getUsernameFromUrl() {
  return new URLSearchParams(window.location.search).get("username") || ""
}

function App() {
  const editorRef = useRef(null)
  const bindingRef = useRef(null)
  const [roomId, setRoomId] = useState(getRoomIdFromPath)
  const [username, setUsername] = useState(getUsernameFromUrl)
  const [users, setUsers] = useState([])
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const [errorMessage, setErrorMessage] = useState("")

  const ydoc = useMemo(() => new Y.Doc({ guid: roomId || undefined }), [roomId])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  useEffect(() => {
    const handlePopState = () => {
      setRoomId(getRoomIdFromPath())
      setUsername(getUsernameFromUrl())
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const navigateToRoom = (nextRoomId, nextUsername) => {
    const search = new URLSearchParams({ username: nextUsername })
    window.history.pushState({}, "", `/room/${nextRoomId}?${search}`)
    setRoomId(nextRoomId)
    setUsername(nextUsername)
    setErrorMessage("")
  }

  const handleMount = (editor) => {
    editorRef.current = editor
    bindingRef.current?.destroy()
    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
    )
  }

  const getFormValues = (event) => ({
    username: event.currentTarget.username.value.trim(),
    roomId: event.currentTarget.roomId.value.trim(),
  })

  const handleCreateRoom = async (event) => {
    event.preventDefault()
    const { username: nextUsername } = getFormValues(event)

    if (!nextUsername) {
      setErrorMessage("Enter a display name first.")
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/rooms`, { method: "POST" })
      if (!response.ok) throw new Error("Room creation failed")
      const data = await response.json()
      navigateToRoom(data.room.roomId, nextUsername)
    } catch (error) {
      console.error(error)
      setErrorMessage("Could not create a room. Is the backend running?")
    }
  }

  const handleJoinRoom = async (event) => {
    event.preventDefault()
    const { username: nextUsername, roomId: nextRoomId } = getFormValues(event)

    if (!nextUsername || !nextRoomId) {
      setErrorMessage("Enter both a display name and room ID.")
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/rooms/${encodeURIComponent(nextRoomId)}`)
      const data = await response.json()
      if (!response.ok) {
        setErrorMessage(data.message || "Room not found.")
        return
      }
      navigateToRoom(data.room.roomId, nextUsername)
    } catch (error) {
      console.error(error)
      setErrorMessage("Could not join the room. Is the backend running?")
    }
  }

  const handleSubmit = (event) => {
    if (event.nativeEvent.submitter?.value === "create") {
      return handleCreateRoom(event)
    }
    return handleJoinRoom(event)
  }

  useEffect(() => {
    if (!roomId || !username) return undefined

    const provider = new SocketIOProvider(SOCKET_URL, roomId, ydoc, {
      autoConnect: true,
    })

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values())
      setUsers(
        states
          .filter((state) => state.user?.username)
          .map((state) => state.user),
      )
    }
    const handleStatus = ({ status }) => setConnectionStatus(status)
    const handleConnectionError = (error) => {
      console.error("Collaboration connection failed", error)
      setConnectionStatus("disconnected")
    }
    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField("user", null)
    }

    provider.awareness.setLocalStateField("user", { username })
    provider.awareness.on("change", updateUsers)
    provider.on("status", handleStatus)
    provider.on("connection-error", handleConnectionError)
    window.addEventListener("beforeunload", handleBeforeUnload)
    updateUsers()

    return () => {
      provider.awareness.off("change", updateUsers)
      provider.off("status", handleStatus)
      provider.off("connection-error", handleConnectionError)
      provider.awareness.setLocalStateField("user", null)
      provider.disconnect()
      window.removeEventListener("beforeunload", handleBeforeUnload)
      setUsers([])
    }
  }, [roomId, username, ydoc])

  useEffect(() => () => {
    bindingRef.current?.destroy()
    ydoc.destroy()
  }, [ydoc])

  if (!roomId || !username) {
    return (
      <main className="min-h-screen w-full bg-[#09090b] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-zinc-950 to-zinc-950 p-8 shadow-2xl">
          <div className="w-full max-w-md">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">SyncScript</p>
            <h1 className="text-4xl font-bold tracking-tight">Collaborate in real time.</h1>
            <p className="mt-4 text-zinc-400">Create a room or join an existing one to start editing together.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-3">
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
                <button type="submit" value="join" className="flex-1 rounded-xl border border-white/15 px-4 py-3 font-semibold transition hover:bg-white/10">
                  Join room
                </button>
                <button type="submit" value="create" className="flex-1 rounded-xl bg-violet-500 px-4 py-3 font-semibold transition hover:bg-violet-400">
                  Create room
                </button>
              </div>
            </form>
            {errorMessage && <p className="mt-4 text-sm text-red-300">{errorMessage}</p>}
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
            <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <span className={`h-2 w-2 rounded-full ${connectionStatus === "connected" ? "bg-emerald-400" : "bg-amber-300"}`} />
              {connectionStatus}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-zinc-500">{roomId}</p>
        </div>
        <div className="flex-1 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{users.length} online</p>
          <ul className="space-y-2">
            {users.map((user, index) => (
              <li key={`${user.username}-${index}`} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200">{user.username.slice(0, 1).toUpperCase()}</span>
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
        <div className="min-h-0 flex-1">
          <Editor height="100%" defaultLanguage="javascript" defaultValue="// Start writing together..." theme="vs-dark" onMount={handleMount} options={{ minimap: { enabled: false }, padding: { top: 16 } }} />
        </div>
      </section>
    </main>
  )
}

export default App
