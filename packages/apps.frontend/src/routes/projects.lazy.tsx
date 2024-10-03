import { MutationForm } from "@/components/form/mutation-form"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ErrorDisplay } from "@/components/ui/result-display"
import { tsr } from "@/lib/api-client"
import { createLazyFileRoute, Link } from "@tanstack/react-router"
import { AddProjectInputSchema } from "apps.backend.api"
import { Loader } from "lucide-react"
import { useState } from "react"

export const Route = createLazyFileRoute("/projects")({
  component: Projects,
})

export function Projects() {
  const queryClient = tsr.useQueryClient()
  const { data, isPending, isError } = tsr.projects.listAllProjects.useQuery({
    queryKey: ["projects"],
  })

  if (isPending) {
    return (
      <main className="h-full">
        <h1>Projects</h1>
        <Loader />
      </main>
    )
  }

  if (isError) {
    return (
      <main className="h-full">
        <h1>Projects</h1>
        <p>Erro</p>
      </main>
    )
  }

  const [output, err] = data.body

  if (err != null) {
    return <ErrorDisplay err={err} />
  }

  return (
    <main className="h-full">
      <div className="grid gap-2 grid-cols-1">
        <h1>Projects</h1>
        <p>
          <AddProjectButton
            onSuccess={() => {
              void queryClient.invalidateQueries({
                queryKey: ["projects"],
              })
            }}
          />
        </p>
        <ul className="grid grid-cols-4 gap-2">
          {output.projectConfigs.map((projectConfig) => (
            <li key={projectConfig.name}>
              <Link to={`/projects/${projectConfig.name}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>{projectConfig.name}</CardTitle>
                    <CardDescription className="whitespace-nowrap overflow-ellipsis overflow-hidden">
                      {projectConfig.root}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

interface AddProjectButtonProps {
  onSuccess: () => void
}
function AddProjectButton({ onSuccess }: AddProjectButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
          <DialogDescription>
            <AddProjectForm
              onSuccess={() => {
                setOpen(false)
                onSuccess()
              }}
            />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

interface AddProjectFormProps {
  onSuccess: () => void
}
function AddProjectForm({ onSuccess }: AddProjectFormProps) {
  const addProject = tsr.projects.addProject.useMutation({
    onSuccess(response) {
      const [_, err] = response.body
      if (err != null) {
        return
      }
      onSuccess()
    },
  })

  return (
    <MutationForm
      mutation={addProject}
      schema={AddProjectInputSchema}
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
          <SubmitButton>Add Project</SubmitButton>
        </>
      )}
    />
  )
}
