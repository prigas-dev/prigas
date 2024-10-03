#!/usr/bin/env -S node_modules/.bin/tsx
import { execute } from "@oclif/core"

process.env.PRIGAS_DEV = "true"
await execute({ development: true, dir: import.meta.url })
