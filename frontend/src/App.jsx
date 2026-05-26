import React from 'react'
import "./App.css"
import {Editor} from "@monaco-editor/react"
function App() {
  return (
    <>
    <main
    className='w-full h-screen bg-gray-950 gap-4 p-2 flex'
    >
     <aside
     className='w-1/4 h-full bg-amber-50 p-8 rounded-lg '>
     </aside>
     <section
     className='w-3/4 h-full bg-neutral-800 rounded-lg' >
      <Editor
      height="100%"
      defaultLanguage="javascript"
      defaultValue="// some comment"
      theme="vs-dark"
      />
     </section>
    </main>

    </>
  )
}

export default App