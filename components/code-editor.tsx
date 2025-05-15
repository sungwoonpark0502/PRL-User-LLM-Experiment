"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { useTheme } from "next-themes"

interface CodeEditorProps {
  language: string
  value: string
  onChange: (value: string) => void
  height?: number
}

export default function CodeEditor({ language, value, onChange, height = 300 }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)
  const editorInstanceRef = useRef<any>(null)
  const { theme } = useTheme()

  useEffect(() => {
    let isComponentMounted = true

    const initMonaco = async () => {
      if (editorRef.current && isComponentMounted) {
        try {
          const monaco = await import("monaco-editor")
          monacoRef.current = monaco

          // Only create a new instance if one doesn't exist
          if (!editorInstanceRef.current && isComponentMounted) {
            // Configure editor
            const editor = monaco.editor.create(editorRef.current, {
              value,
              language: getMonacoLanguage(language),
              theme: theme === "dark" ? "vs-dark" : "vs",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 10,
              automaticLayout: true,
              fontSize: window.innerWidth < 768 ? 12 : 14,
              wordWrap: "on",
              wrappingStrategy: "advanced",
              tabSize: 2,
              renderWhitespace: "selection",
              fixedOverflowWidgets: true,
              contextmenu: true,
              scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                alwaysConsumeMouseWheel: false,
              },
            })

            editorInstanceRef.current = editor

            // Add change event listener
            editor.onDidChangeModelContent(() => {
              if (isComponentMounted) {
                onChange(editor.getValue())
              }
            })

            // Focus the editor after initialization
            setTimeout(() => {
              if (isComponentMounted && editor) {
                editor.focus()
              }
            }, 100)
          }
        } catch (error) {
          console.error("Error initializing Monaco editor:", error)
        }
      }
    }

    initMonaco()

    // Handle window resize
    const handleResize = () => {
      if (editorInstanceRef.current && isComponentMounted) {
        try {
          editorInstanceRef.current.layout()
          editorInstanceRef.current.updateOptions({
            fontSize: window.innerWidth < 768 ? 12 : 14,
          })
        } catch (error) {
          console.error("Error resizing editor:", error)
        }
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      isComponentMounted = false
      window.removeEventListener("resize", handleResize)

      // Safe cleanup of editor instance
      if (editorInstanceRef.current) {
        try {
          // Delay the disposal slightly to avoid race conditions
          setTimeout(() => {
            try {
              if (editorInstanceRef.current) {
                editorInstanceRef.current.dispose()
                editorInstanceRef.current = null
              }
            } catch (error) {
              console.error("Error disposing editor:", error)
            }
          }, 0)
        } catch (error) {
          console.error("Error in cleanup:", error)
        }
      }
    }
  }, [])

  // Update language when it changes
  useEffect(() => {
    if (monacoRef.current && editorInstanceRef.current) {
      try {
        monacoRef.current.editor.setModelLanguage(editorInstanceRef.current.getModel(), getMonacoLanguage(language))
      } catch (error) {
        console.error("Error setting language:", error)
      }
    }
  }, [language])

  // Update value when it changes externally
  useEffect(() => {
    if (editorInstanceRef.current) {
      try {
        const currentValue = editorInstanceRef.current.getValue()
        if (value !== currentValue) {
          editorInstanceRef.current.setValue(value)
          // Position cursor at the end
          const model = editorInstanceRef.current.getModel()
          if (model) {
            const lastLine = model.getLineCount()
            const lastColumn = model.getLineMaxColumn(lastLine)
            editorInstanceRef.current.setPosition({ lineNumber: lastLine, column: lastColumn })
          }
        }
      } catch (error) {
        console.error("Error updating value:", error)
      }
    }
  }, [value])

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current && editorInstanceRef.current) {
      try {
        monacoRef.current.editor.setTheme(theme === "dark" ? "vs-dark" : "vs")
      } catch (error) {
        console.error("Error setting theme:", error)
      }
    }
  }, [theme])

  // Map language selection to Monaco language identifiers
  const getMonacoLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      javascript: "javascript",
      python: "python",
      java: "java",
      cpp: "cpp",
    }
    return languageMap[lang] || "javascript"
  }

  return (
    <Card className="border overflow-hidden dark:border-gray-700">
      <div ref={editorRef} style={{ height: `${height}px` }} className="w-full" />
    </Card>
  )
}
