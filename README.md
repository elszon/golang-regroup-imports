# Golang regroup imports

VSCode extension for separating imports in Go files into groups:

1. Standard library
2. Third party
3. Organization
4. Module
5. Blank
6. Dot

## Extension Settings

> !NOTE
> Setting are applied after vscode restart.

* `regroupImports.onSave`: automatically group imports on save. Default value is `true`.
* `regroupImports.organization`: organization prefix. Default value is empty string.
