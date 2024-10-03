import { useFormContext } from "react-hook-form"
import { Button, ButtonProps } from "../ui/button"

export function SubmitButton(props: Omit<ButtonProps, "type">) {
  const form = useFormContext()
  const disabled = form.formState.disabled || props.disabled
  return <Button {...props} type="submit" disabled={disabled} />
}
