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
    <section className="workspace-launcher">
      <div className="launcher-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>Start a collaborative session</h2>
          <p>Open a room in seconds, then invite your candidate or teammate.</p>
        </div>
        <div className="profile-chip"><span>{user.username.slice(0, 1).toUpperCase()}</span><div><strong>{user.username}</strong><small>{user.email}</small></div></div>
      </div>
      <div className="launcher-grid">
        <form onSubmit={onSubmit} className="launcher-card">
          <span className="launcher-icon">＋</span>
          <h3>Create a new room</h3>
          <p>Start with a clean shared editor and live collaboration.</p>
          <input name="roomName" type="text" placeholder="Room name (optional)" maxLength={100} className="field" />
          <button type="submit" value="create" className="primary-button">Create room <span>→</span></button>
        </form>

        <form onSubmit={onSubmit} className="launcher-card launcher-card-muted">
          <span className="launcher-icon">↗</span>
          <h3>Join an existing room</h3>
          <p>Use the room details shared by your interviewer or teammate.</p>
          <input name="roomId" type="text" placeholder="Room ID" defaultValue={roomId || ""} required className="field" />
          <input name="passcode" type="password" placeholder="Passcode" required className="field" />
          <button type="submit" value="join" className="secondary-button">Join room <span>→</span></button>
        </form>
      </div>

          {createdRoom && (
            <div className="created-room">
              <div><strong>Room ready to share</strong><span>Room ID: <code>{createdRoom.roomId}</code> · Passcode: <code>{createdRoom.passcode}</code></span></div>
              <button type="button" onClick={onOpenCreatedRoom} className="primary-button">Open room</button>
            </div>
          )}

          {errorMessage && <p className="error-banner">{errorMessage}</p>}
          <button type="button" onClick={onLogout} className="text-button launcher-logout">Sign out</button>
    </section>
  );
}