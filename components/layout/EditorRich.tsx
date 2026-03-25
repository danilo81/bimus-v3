"use client"

import { InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer"
import { TooltipProvider } from "@/components/ui/tooltip"
import { editorTheme } from "@/components/editor/themes/editor-theme"
import { nodes } from "@/components/editor/nodes/nodes"
import { Plugins } from "@/components/editor/plugins/plugins"

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes: [...nodes],
  onError: (error: Error) => {
    console.error(error)
  },
}

export function EditorRich() {
  return (
    <div className="bg-background w-full overflow-hidden rounded-lg border shadow">
      <LexicalComposer initialConfig={{ ...editorConfig }}>
        <TooltipProvider>
          <Plugins />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
