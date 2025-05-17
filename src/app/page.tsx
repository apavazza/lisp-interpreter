"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Trash2, Save } from "lucide-react"
import { evaluateLisp } from "@/src/lib/lisp-interpreter"
import { examples } from "@/src/lib/examples"

export default function LispInterpreter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [userInput, setUserInput] = useState<string>("") // User input for read-line

  const runCode = useCallback(() => {
    try {
      setError(null)
      
      // Create a closure to capture the current lineIndex state
      let lineIndex = 0;
      
      const inputProvider = () => {
        // Split the input into lines
        const lines = userInput.split('\n')
        
        // Get the next line or empty string if we've read all lines
        const line = lineIndex < lines.length ? lines[lineIndex] : ""
        
        // Increment our local counter for subsequent reads
        lineIndex++
        
        return line
      }
      
      const result = evaluateLisp(input, inputProvider)
      setOutput(result)
    } catch (err) {
      setError((err as Error).message)
      setOutput("")
    }
  }, [input, userInput])

  const clearAll = () => {
    setInput("")
    setOutput("")
    setError(null)
    setUserInput("")
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
        // Check if focus is not on the userInput field to prevent running code when submitting userInput
        if (document.activeElement?.id !== "runtimeUserInput") {
          runCode()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [runCode])

  return (
    <div className="flex flex-col h-full">
      <header className="border-b p-4 bg-gray-50">
        <h1 className="text-2xl font-bold">Lisp Interpreter</h1>
      </header>
      
      {/* Control Bar - Buttons first, then examples dropdown */}
      <div className="p-4 flex flex-wrap items-center gap-4 border-b">
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
        
        {/* Examples dropdown after the buttons */}
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
      </div>
      
      {/* Main content area - with responsive layout */}
      <div className="p-4 pb-1 gap-4 flex-1 overflow-auto flex flex-col md:flex-row md:pb-4">
        {/* Code Input Section - Left column on desktop, top section on mobile */}
        <div className="flex flex-col gap-2 min-h-0 flex-shrink-0 md:flex-1 md:min-w-0">
          <h2 className="text-lg font-medium">Code</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 font-mono p-3 border rounded resize-none min-h-[200px] md:min-h-0"
            placeholder="Enter Lisp code here..."
            spellCheck={false}
          />
        </div>
        
        {/* Right side container - Only used on desktop */}
        <div className="flex flex-col gap-4 min-h-0 md:flex-1 md:min-w-0">
          {/* Runtime Input Section */}
          <div className="flex flex-col gap-2 mt-4 md:mt-0">
            <h2 className="text-lg font-medium">Runtime Input</h2>
            <textarea
              id="runtimeUserInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded shadow-sm font-mono"
              placeholder="Multi-line input for Lisp program..."
              rows={5}
              spellCheck={false}
            />
            <p className="text-xs text-gray-500">
              Each call to <code className="bg-gray-200 p-0.5 rounded">(read-line)</code> will read the next line
            </p>
          </div>
          
          {/* Output Section - reduced bottom margin on mobile */}
          <div className="flex flex-col gap-2 flex-1 min-h-0 mt-4 mb-1 md:mb-0">
            <h2 className="text-lg font-medium">Output</h2>
            <div className="border rounded p-3 font-mono bg-gray-50 overflow-auto whitespace-pre-wrap flex-1 min-h-[200px] md:min-h-0">
              {error ? (
                <div className="text-red-500">Error: {error}</div>
              ) : output ? (
                output
              ) : (
                <div className="text-gray-400 italic">Output will appear here...</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-3 text-center text-sm text-gray-500">
        <p>Press Ctrl+Enter to run code.</p>
      </div>
    </div>
  )
}
