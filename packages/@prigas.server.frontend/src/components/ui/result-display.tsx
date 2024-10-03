import { AppError } from "libs.result"

export interface ErrorDisplayProps<TErr extends AppError> {
  err: TErr | null | undefined
}
export function ErrorDisplay<TErr extends AppError>({
  err,
}: ErrorDisplayProps<TErr>) {
  if (err == null) {
    return null
  }
  return (
    <div>
      <p>{err.message}</p>
    </div>
  )
}
