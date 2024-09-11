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
prigas/0.0.0 win32-x64 node-v20.12.2
$ prg --help [COMMAND]
USAGE
  $ prg COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`prg hello PERSON`](#prg-hello-person)
* [`prg hello world`](#prg-hello-world)
* [`prg help [COMMAND]`](#prg-help-command)
* [`prg plugins`](#prg-plugins)
* [`prg plugins add PLUGIN`](#prg-plugins-add-plugin)
* [`prg plugins:inspect PLUGIN...`](#prg-pluginsinspect-plugin)
* [`prg plugins install PLUGIN`](#prg-plugins-install-plugin)
* [`prg plugins link PATH`](#prg-plugins-link-path)
* [`prg plugins remove [PLUGIN]`](#prg-plugins-remove-plugin)
* [`prg plugins reset`](#prg-plugins-reset)
* [`prg plugins uninstall [PLUGIN]`](#prg-plugins-uninstall-plugin)
* [`prg plugins unlink [PLUGIN]`](#prg-plugins-unlink-plugin)
* [`prg plugins update`](#prg-plugins-update)

## `prg hello PERSON`

Say hello

```
USAGE
  $ prg hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ prg hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/prigas-dev/prigas/blob/v0.0.0/src/commands/hello/index.ts)_

## `prg hello world`

Say hello world

```
USAGE
  $ prg hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ prg hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/prigas-dev/prigas/blob/v0.0.0/src/commands/hello/world.ts)_

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

## `prg plugins`

List installed plugins.

```
USAGE
  $ prg plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ prg plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.7/src/commands/plugins/index.ts)_

## `prg plugins add PLUGIN`

Installs a plugin into prg.

```
USAGE
  $ prg plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into prg.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the PRG_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the PRG_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ prg plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ prg plugins add myplugin

  Install a plugin from a github url.

    $ prg plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ prg plugins add someuser/someplugin
```

## `prg plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ prg plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ prg plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.7/src/commands/plugins/inspect.ts)_

## `prg plugins install PLUGIN`

Installs a plugin into prg.

```
USAGE
  $ prg plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into prg.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the PRG_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the PRG_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ prg plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ prg plugins install myplugin

  Install a plugin from a github url.

    $ prg plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ prg plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.7/src/commands/plugins/install.ts)_

## `prg plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ prg plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ prg plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.7/src/commands/plugins/link.ts)_

## `prg plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ prg plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prg plugins unlink
  $ prg plugins remove

EXAMPLES
  $ prg plugins remove myplugin
```

## `prg plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ prg plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.7/src/commands/plugins/reset.ts)_

## `prg plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ prg plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prg plugins unlink
  $ prg plugins remove

EXAMPLES
  $ prg plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.7/src/commands/plugins/uninstall.ts)_

## `prg plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ prg plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ prg plugins unlink
  $ prg plugins remove

EXAMPLES
  $ prg plugins unlink myplugin
```

## `prg plugins update`

Update installed plugins.

```
USAGE
  $ prg plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.7/src/commands/plugins/update.ts)_
<!-- commandsstop -->
