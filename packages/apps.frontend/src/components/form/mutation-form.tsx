import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { DefaultError, UseMutationResult } from "@tanstack/react-query"
import { AppError, Result } from "libs.result"
import { FC } from "react"
import {
  DefaultValues,
  FieldValues,
  useForm,
  UseFormReturn,
} from "react-hook-form"
import { z } from "zod"
import { Form } from "../ui/form"
import { ErrorDisplay } from "../ui/result-display"

export interface MutationFormProps<
  TInput extends FieldValues = FieldValues,
  TOk = unknown,
  TErr extends AppError = AppError,
  TMutationError = DefaultError,
  TMutationContext = unknown,
> {
  mutation: UseMutationResult<
    { status: 200; body: Result<TOk, TErr> },
    TMutationError,
    { body: TInput },
    TMutationContext
  >
  schema: z.ZodType<TInput>
  Content: FC<{ form: UseFormReturn<TInput> }>
  className?: string
  defaultValues?: DefaultValues<TInput>
  onSubmit?: (input: TInput) => boolean
}
export function MutationForm<
  TInput extends FieldValues = FieldValues,
  TOk = unknown,
  TErr extends AppError = AppError,
  TMutationError = DefaultError,
  TMutationContext = unknown,
>({
  mutation,
  schema,
  Content,
  className,
  defaultValues,
  onSubmit,
}: MutationFormProps<TInput, TOk, TErr, TMutationError, TMutationContext>) {
  const { mutate, isPending, data } = mutation

  const form = useForm<TInput>({
    resolver: zodResolver(schema),
    disabled: isPending,
    defaultValues: defaultValues,
  })

  function submit(input: TInput) {
    if (onSubmit != null) {
      const shouldSubmit = onSubmit(input)
      if (!shouldSubmit) {
        return
      }
    }
    mutate({ body: input })
  }

  return (
    <Form {...form}>
      <ErrorDisplay err={data?.body?.[1]} />
      <form
        onSubmit={form.handleSubmit(submit)}
        className={cn("grid grid-cols-1 gap-2", className)}
      >
        <Content form={form} />
      </form>
    </Form>
  )
}
