# SyncScript frontend

The Vite development server runs on local HTTP. Start the frontend with
`npm run dev`, then open:

`http://localhost:5173`

Use `localhost` rather than a network IP for local camera and microphone
testing. Browsers treat localhost as a secure context for media permissions.

For video calls between different devices, the frontend must be served from an
HTTPS origin with a trusted certificate. Plain `http://192.168.x.x:5173` can
load the editor, but browsers will block camera and microphone access.

WebRTC uses Google STUN by default. For participants on networks that block
direct peer connections, configure a TURN server in the frontend environment
before starting Vite:

```env
VITE_TURN_URL=turn:turn.example.com:3478
VITE_TURN_USERNAME=your-turn-username
VITE_TURN_CREDENTIAL=your-turn-credential
```

The remote video tile includes an **Enable participant audio** control when the
browser blocks audible autoplay. This is expected browser behavior; click it
once after joining to hear the participant.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
