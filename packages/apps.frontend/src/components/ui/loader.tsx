import { useEffect, useState } from "react"

export function Loader() {
  const [count, setCount] = useState(1)
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((count) => {
        return count >= 3 ? 1 : count + 1
      })
    }, 100)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const dots = ".".repeat(count)

  return <div>Loading{dots}</div>
}
