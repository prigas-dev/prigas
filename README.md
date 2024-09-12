prigas
=================

A CLI to guide with web applications development and deployment


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/prigas.svg)](https://npmjs.org/package/prigas)
[![Downloads/week](https://img.shields.io/npm/dw/prigas.svg)](https://npmjs.org/package/prigas)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g prigas
$ prg COMMAND
running command...
$ prg (--version)
prigas/0.0.3-beta.7 linux-x64 node-v20.17.0
$ prg --help [COMMAND]
USAGE
  $ prg COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`prg help [COMMAND]`](#prg-help-command)
* [`prg new`](#prg-new)

## `prg help [COMMAND]`

Display help for prg.

```
USAGE
  $ prg help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for prg.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.11/src/commands/help.ts)_

## `prg new`

Create a new application

```
USAGE
  $ prg new [-n <value>]

FLAGS
  -n, --name=<value>  Application name

DESCRIPTION
  Create a new application

EXAMPLES
  $ prg new
```

_See code: [src/commands/new.ts](https://github.com/prigas-dev/prigas/blob/v0.0.3-beta.7/src/commands/new.ts)_
<!-- commandsstop -->
