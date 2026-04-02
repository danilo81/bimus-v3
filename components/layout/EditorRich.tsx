"use client"

import { InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { EditorState } from "lexical"
import { TooltipProvider } from "@/components/ui/tooltip"
import { editorTheme } from "@/components/editor/themes/editor-theme"
import { nodes } from "@/components/editor/nodes/nodes"
import { Plugins } from "@/components/editor/plugins/plugins"

interface EditorRichProps {
  /** Lexical serialized JSON string (from topic.content) */
  initialContent?: string
  /** Called on every content change with the serialized JSON string */
  onChange?: (jsonContent: string) => void
  /** Opcional tailwind classes for the container */
  className?: string
}

export function EditorRich({ initialContent, onChange, className }: EditorRichProps) {
  const editorConfig: InitialConfigType = {
    namespace: "Editor",
    theme: editorTheme,
    nodes: [...nodes],
    onError: (error: Error) => {
      console.error(error)
    },
    // Only set on mount - once the editor is created this won't update
    ...(initialContent ? { editorState: initialContent } : {}),
  }

  const handleChange = (editorState: EditorState) => {
    if (onChange) {
      onChange(JSON.stringify(editorState.toJSON()))
    }
  }

  return (
    <div className={`bg-background w-full overflow-hidden rounded-lg border justify-between flex flex-col ${className || ""}`}>
      <LexicalComposer initialConfig={editorConfig}>
        <TooltipProvider>
          <Plugins />
          <OnChangePlugin ignoreSelectionChange={true} onChange={handleChange} />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
