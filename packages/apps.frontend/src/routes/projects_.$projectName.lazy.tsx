import { MutationForm } from "@/components/form/mutation-form"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader } from "@/components/ui/loader"
import { ErrorDisplay } from "@/components/ui/result-display"
import { Terminal } from "@/components/ui/terminal"
import { env } from "@/env"
import { tsr } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { createLazyFileRoute, useRouter } from "@tanstack/react-router"
import {
  ProjectConfig,
  RunProjectInputSchema,
  StopProjectInputSchema,
  UpdateProjectInputSchema,
} from "apps.backend.api"
import { Edit3, Play, Square } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export const Route = createLazyFileRoute("/projects/$projectName")({
  component: ProjectPage,
})

function ProjectPage() {
  const { projectName } = Route.useParams()

  const [isRunning, setIsRunning] = useState(false)

  const { data, isError, isPending } = tsr.projects.getProject.useQuery({
    queryKey: ["projects", projectName],
    queryData: {
      query: {
        projectName,
      },
    },
  })

  if (isError) {
    return <div>Error</div>
  }

  if (isPending) {
    return <Loader />
  }

  const [output, err] = data.body

  if (err != null) {
    return <ErrorDisplay err={err} />
  }

  const { projectConfig } = output

  return (
    <main className="h-full flex flex-col gap-2">
      <h1>Project - {projectConfig.name}</h1>
      <CommandsBar isRunning={isRunning} projectConfig={projectConfig} />
      <ProjectRunTerminal
        className="grow"
        projectConfig={projectConfig}
        onIsRunningChange={setIsRunning}
      />
    </main>
  )
}

interface CommandsBarProps {
  className?: string
  projectConfig: ProjectConfig
  isRunning: boolean
}
function CommandsBar({
  className,
  projectConfig,
  isRunning,
}: CommandsBarProps) {
  const router = useRouter()
  const queryClient = tsr.useQueryClient()

  return (
    <div className={cn("flex flex-row gap-2", className)}>
      <RunProjectButton isRunning={isRunning} projectConfig={projectConfig} />
      <EditProjectButton
        loadedProjectConfig={projectConfig}
        onSuccess={(projectName) => {
          if (projectName !== projectConfig.name) {
            void router.navigate({
              to: `/projects/${projectName}`,
            })
          } else {
            void queryClient.invalidateQueries({
              queryKey: ["projects", projectName],
            })
            void router.invalidate()
          }
        }}
      />
    </div>
  )
}

interface EditProjectButtonProps {
  className?: string
  onSuccess: (projectName: string) => void
  loadedProjectConfig: ProjectConfig
}
function EditProjectButton({
  className,
  loadedProjectConfig,
  onSuccess,
}: EditProjectButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn(className)}>
          <Edit3 /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit - {loadedProjectConfig.name}</DialogTitle>
          <DialogDescription>
            <EditProjectForm
              className="grow"
              loadedProjectConfig={loadedProjectConfig}
              onSuccess={(projectName) => {
                setOpen(false)
                onSuccess(projectName)
              }}
            />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

interface EditProjectFormProps {
  className?: string
  loadedProjectConfig: ProjectConfig
  onSuccess: (projectName: string) => void
}
function EditProjectForm({
  className,
  loadedProjectConfig,
  onSuccess,
}: EditProjectFormProps) {
  const updateProject = tsr.projects.updateProject.useMutation({
    onSuccess(response, request) {
      const [_, err] = response.body
      if (err != null) {
        return
      }
      onSuccess(request.body.projectConfig.name)
    },
  })
  return (
    <MutationForm
      className={cn(className)}
      mutation={updateProject}
      schema={UpdateProjectInputSchema}
      defaultValues={{
        projectName: loadedProjectConfig.name,
        projectConfig: loadedProjectConfig,
      }}
      Content={({ form }) => (
        <>
          <TextField
            form={form}
            name="projectConfig.name"
            label="Project name"
            placeholder="any valid directory name"
          />
          <TextField
            form={form}
            name="projectConfig.root"
            label="Project folder"
            placeholder="Project absolute path from your file system"
          />
          <div>
            <h2>Commands</h2>
            <TextField
              form={form}
              name="projectConfig.commands.run"
              label="Run"
              placeholder="npm run start"
            />
          </div>
          <SubmitButton>Save</SubmitButton>
        </>
      )}
    />
  )
}

interface RunProjectButtonProps {
  className?: string
  projectConfig: ProjectConfig
  isRunning: boolean
}
function RunProjectButton({
  projectConfig,
  isRunning,
  className,
}: RunProjectButtonProps) {
  const runProject = tsr.projects.runProject.useMutation()
  const stopProject = tsr.projects.stopProject.useMutation()

  if (isRunning) {
    return (
      <MutationForm
        className={cn(className)}
        mutation={stopProject}
        schema={StopProjectInputSchema}
        defaultValues={{ projectName: projectConfig.name }}
        Content={() => (
          <SubmitButton>
            <Square className="text-red-600" /> Stop
          </SubmitButton>
        )}
      />
    )
  }

  return (
    <MutationForm
      className={cn(className)}
      mutation={runProject}
      schema={RunProjectInputSchema}
      defaultValues={{ projectName: projectConfig.name }}
      onSubmit={() => {
        if (!projectConfig.commands.run) {
          toast.info("Please Edit the project and add a Run Command.")
          return false
        }
        return true
      }}
      Content={() => (
        <SubmitButton>
          <Play className="text-green-400" /> Run
        </SubmitButton>
      )}
    />
  )
}

interface ProjectRunTerminalProps {
  className?: string
  projectConfig: ProjectConfig
  onIsRunningChange: (isRunning: boolean) => void
}
function ProjectRunTerminal({
  className,
  projectConfig,
  onIsRunningChange,
}: ProjectRunTerminalProps) {
  const [socket, setSocket] = useState<WebSocket>()

  useEffect(() => {
    const url = new URL("/projects/connectRunTerminal", env.BackendBaseUrl)
    url.searchParams.set("projectName", projectConfig.name)
    const newSocket = new WebSocket(url)
    setSocket(newSocket)

    newSocket.addEventListener("open", () => {
      console.log("WebSocket connection established")
    })
    newSocket.addEventListener("close", (ev) => {
      console.log("WebSocket connection closed", {
        code: ev.code,
        reason: ev.reason,
      })
    })
    newSocket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error)
    })

    let sessionId: string | null = null
    const startDetector = function (ev: MessageEvent) {
      if (typeof ev.data !== "string" || sessionId != null) {
        return
      }
      if (ev.data.startsWith("Started:")) {
        ev.stopImmediatePropagation()
        sessionId = ev.data.substring(8).trim()
        onIsRunningChange(true)
      }
    }

    const finishDetector = function (ev: MessageEvent) {
      if (typeof ev.data !== "string" || sessionId == null) {
        return
      }
      if (ev.data.startsWith("Finished:")) {
        const capturedSessionId = ev.data.substring(9).trim()
        if (capturedSessionId === sessionId) {
          ev.stopImmediatePropagation()
          sessionId = null
          onIsRunningChange(false)
        }
      }
    }
    newSocket.addEventListener("message", startDetector)
    newSocket.addEventListener("message", finishDetector)

    return () => {
      newSocket.close()
      setSocket(undefined)
    }
  }, [projectConfig.name, onIsRunningChange])

  return (
    <div className={cn(className)}>
      <Terminal socket={socket} />
    </div>
  )
}
