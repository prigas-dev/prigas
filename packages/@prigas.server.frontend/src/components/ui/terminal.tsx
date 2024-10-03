import { env } from "@/env"
import { cn } from "@/lib/utils"
import { AttachAddon } from "@xterm/addon-attach"
import { FitAddon } from "@xterm/addon-fit"
import {
  ITerminalInitOnlyOptions,
  ITerminalOptions,
  Terminal as XtermTerminal,
} from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"
import { useEffect, useRef } from "react"
import "./terminal.css"

export interface TerminalProps {
  className?: string
  xtermInitOptions?: ITerminalInitOnlyOptions
  xtermOptions?: ITerminalOptions
  socket?: WebSocket
}
export function Terminal({
  className,
  socket,
  xtermInitOptions,
  xtermOptions,
}: TerminalProps) {
  const terminalRef = useRef<XtermTerminal | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current == null) {
      return
    }

    const terminal = new XtermTerminal({
      convertEol: true,
      ...xtermInitOptions,
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    if (env.OS === "win" || env.OS === "linux") {
      // Handle Copy and Paste
      terminal.attachCustomKeyEventHandler((event) => {
        if (event.ctrlKey && event.key === "c") {
          if (terminal.hasSelection()) {
            const selectedText = terminal.getSelection()

            navigator.clipboard
              .writeText(selectedText)
              .then(() => {
                terminal.clearSelection()
              })
              .catch((err) => {
                console.error("Could not copy text: ", err)
              })
            event.preventDefault()
            return false // Prevent xterm.js from processing the event
          }
        }

        if (event.ctrlKey && event.key === "v") {
          // Optionally, you can handle Ctrl + V here if you need to customize behavior
          // For now, we will allow xterm.js to handle it
          return true // Allow xterm.js to process the event
        }

        // Allow xterm.js to handle other keys
        return true
      })
    }

    terminal.open(containerRef.current)
    fitAddon.fit()

    const resizeHandler = () => fitAddon.fit()
    window.addEventListener("resize", resizeHandler)

    terminalRef.current = terminal

    return () => {
      window.removeEventListener("resize", resizeHandler)
      terminal.dispose()
    }
  }, [xtermInitOptions])

  useEffect(() => {
    if (terminalRef.current && xtermOptions) {
      Object.assign(terminalRef.current.options, xtermOptions)
    }
  }, [xtermOptions])

  useEffect(() => {
    const terminal = terminalRef.current
    if (socket == null || terminal == null) {
      return
    }

    const attachAddon = new AttachAddon(socket)
    terminal.loadAddon(attachAddon)

    return () => {
      attachAddon.dispose()
    }
  }, [socket])

  return (
    <div className={cn("w-full h-full", className)} ref={containerRef}></div>
  )
}
