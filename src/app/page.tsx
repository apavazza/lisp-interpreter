"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Trash2, Save } from "lucide-react"
import { evaluateLisp } from "@/src/lib/lisp-interpreter"
import { examples } from "@/src/lib/examples"

export default function LispInterpreter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const runCode = useCallback(() => {
    try {
      setError(null)
      const result = evaluateLisp(input)
      setOutput(result)
    } catch (err) {
      setError((err as Error).message)
      setOutput("")
    }
  }, [input])

  const clearAll = () => {
    setInput("")
    setOutput("")
    setError(null)
  }

  const loadExample = (code: string) => {
    setInput(code)
    setOutput("")
    setError(null)
  }

  const saveFile = () => {
    const filename = "lisp_program.lsp"
    const blob = new Blob([input], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        runCode()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [runCode])

  return (
    <div className="flex flex-col min-h-[calc(100vh-70px)]">
      <header className="border-b p-4 bg-gray-50">
        <h1 className="text-2xl font-bold">Lisp Interpreter</h1>
      </header>
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-10 flex items-center justify-between">
            <h2 className="text-lg font-medium">Input</h2>
            <div className="flex gap-2">
              <select
                className="text-sm border rounded px-2 py-1"
                onChange={(e) => {
                  const selected = examples.find((ex) => ex.name === e.target.value)
                  if (selected) loadExample(selected.code)
                }}
                value=""
              >
                <option value="" disabled>
                  Examples
                </option>
                {examples.map((ex, i) => (
                  <option key={i} value={ex.name}>
                    {ex.name}
                  </option>
                ))}
              </select>
              <button
                onClick={runCode}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                title="Run (Ctrl+Enter)"
              >
                <Play className="h-4 w-4" />
                Run
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
              <button
                onClick={saveFile}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Download file"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 font-mono min-h-[300px] md:min-h-[500px] p-3 border rounded resize-none"
            placeholder="Enter Lisp code here..."
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-10 flex items-center justify-between">
            <h2 className="text-lg font-medium">Output</h2>
            <div className="invisible">
              <button className="flex items-center gap-1 px-3 py-1 text-sm">
                <Play className="h-4 w-4" />
                Run
              </button>
            </div>
          </div>
          <div className="flex-1 border rounded p-3 font-mono bg-gray-50 overflow-auto min-h-[300px] md:min-h-[500px] whitespace-pre-wrap">
            {error ? (
              <div className="text-red-500">Error: {error}</div>
            ) : output ? (
              output
            ) : (
              <div className="text-gray-400 italic">Output will appear here...</div>
            )}
          </div>
        </div>
      </main>
      <footer className="p-2 text-center text-sm text-gray-500">
        <p>Press Ctrl+Enter to run code.</p>
      </footer>
    </div>
  )
}
