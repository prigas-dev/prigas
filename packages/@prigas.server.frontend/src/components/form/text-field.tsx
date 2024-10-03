/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { Input, InputProps } from "../ui/input"

export type TextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<InputProps, "form"> & {
  form: UseFormReturn<TFieldValues, TContext, TTransformedValues>
  name: TName
  label?: string
  placeholder?: string
}
export function TextField<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  form,
  name,
  label,
  onChange,
  ...props
}: TextFieldProps<TFieldValues, TContext, TTransformedValues, TName>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label != null && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input
              {...field}
              {...props}
              onChange={(evt) => {
                field.onChange(evt)
                onChange?.(evt)
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
