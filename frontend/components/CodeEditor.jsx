import { Editor } from "@monaco-editor/react";

export default function CodeEditor({
  username,
  onMount,
  readOnly = false,
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e1e]">
      <div className="flex min-h-14 items-center justify-between border-b border-white/10 bg-zinc-900 px-5">
        <div>
          <p className="font-medium">index.js</p>

          <p className="text-xs text-zinc-500">
            Changes sync automatically
          </p>
        </div>

        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
          {username}
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// Start writing together..."
          theme="vs-dark"
          onMount={onMount}
          options={{
            readOnly,
            minimap: {
              enabled: false,
            },
            padding: {
              top: 16,
            },
          }}
        />
      </div>
    </section>
  );
}