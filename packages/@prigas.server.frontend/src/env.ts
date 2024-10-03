const userAgent = navigator.userAgent.toLowerCase()
export const env = {
  OS: userAgent.includes("win")
    ? ("win" as const)
    : userAgent.includes("linux")
      ? ("linux" as const)
      : ("mac" as const),
  BackendBaseUrl: "http://localhost:8081",
}
