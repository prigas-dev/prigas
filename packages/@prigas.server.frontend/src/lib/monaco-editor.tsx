import monaco from "monaco-editor"
import { useEffect, useRef } from "react"
import { cn } from "./utils"

export interface MonacoEditorProps {
  className?: string
  model: monaco.editor.ITextModel
  options?: monaco.editor.IEditorOptions
}
export function MonacoEditor({ className, model, options }: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const viewStatesRef = useRef(
    new Map<monaco.editor.ITextModel, monaco.editor.ICodeEditorViewState>(),
  )

  useEffect(() => {
    const container = containerRef.current
    if (container == null) {
      return
    }

    const editor = editorRef.current ?? monaco.editor.create(container, options)
    if (editor !== editorRef.current) {
      editor.onDidDispose(() => {
        editorRef.current = null
      })

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSuggestionDiagnostics: true,
        noSyntaxValidation: true,
      })

      monaco.editor.getModelMarkers(model as any)
    } else {
      if (options != null) {
        editor.updateOptions(options)
      }
    }

    editorRef.current = editor

    return () => {
      editor.dispose()
    }
  }, [options])

  useEffect(() => {
    const editor = editorRef.current
    const viewStates = viewStatesRef.current

    if (editor != null) {
      const previousModel = editor.getModel()
      if (previousModel != null) {
        const viewState = editor.saveViewState()
        if (viewState != null) {
          viewStates.set(previousModel, viewState)
        }
      }
      editor.setModel(model)
      const viewState = viewStates.get(model)
      if (viewState != null) {
        editor.restoreViewState(viewState)
      }
    }
  }, [model])

  return (
    <div className={cn("w-full h-full", className)} ref={containerRef}></div>
  )
}
