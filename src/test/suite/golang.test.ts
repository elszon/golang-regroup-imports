import * as assert from 'assert';
import * as vscode from 'vscode';
import * as golang from '../../golang';

suite('Golang Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Returns null for file without imports', () => {
    const documentText = `
        package main

        func main() {}
        `;

    const range = golang.findImports(documentText);

    assert.equal(range, null)
  });

  test('Returns null if no multiline imports in file', () => {
    const documentText = `
        package main

        import "fmt"

        func main() {
          fmt.Println("Hello!")
        }
        `;

    const range = golang.findImports(documentText);

    assert.equal(range, null)
  });

  test('Returns proper range on import statements in file', () => {
    const documentText = `
        package main

        import (
          "fmt"
          "strings"
          "github.com/blackdahila/package"
        )

        func main() {
          fmt.Println("Hello!")
          package.FindAllIds(strings.Split("1, 2, 3, 4", ","))
        }
        `;

    const range = golang.findImports(documentText);

    assert.notEqual(range, null)

    assert.equal(range?.start.line, 4);
    assert.equal(range?.end.line, 6);
  });

  test('Returns proper range on import statements in file regarding empty lines', () => {
    const documentText = `
        package main

        import (
          "fmt"

          "strings"

          "github.com/blackdahila/package"
        )

         func main() {
           fmt.Println("Hello!")
           package.FindAllIds(strings.Split("1, 2, 3, 4", ","))
         }
         `;

    const range = golang.findImports(documentText);

    assert.notEqual(range, null)

    assert.equal(range?.start.line, 4);
    assert.equal(range?.end.line, 8);
  });

  test('Returns proper range on import statements in file with receptive entries', () => {
    const documentText = `
        package main

        import (
          "fmt"
          "github.com/blackdahila/package"
          "github.com/blackdahila/package"

          "strings"

          "github.com/blackdahila/package"
        )

         func main() {
           fmt.Println("Hello!")
           package.FindAllIds(strings.Split("1, 2, 3, 4", ","))
         }
         `;

    const range = golang.findImports(documentText);

    assert.notEqual(range, null)

    assert.equal(range?.start.line, 4);
    assert.equal(range?.end.line, 10);
  });

  test('Returns null when no workspace directory', () => {
    const goMod = golang.findProjectModule("some_long_file_name", Array<string>())
    assert.equal(goMod, null)
  });

  test('Returns null when filepath dosent match any workspace directory', () => {
    const goMod = golang.findProjectModule("some_long_file_name", Array<string>("some", "workspace"))
    assert.equal(goMod, null)
  });


  test('Returns ordered imports', () => {
    const groups = Array<string[]>(
      Array<string>(),
      Array<string>(),
      Array<string>("first"),
      Array<string>(),
      Array<string>(),
      Array<string>("second", "third"),
      Array<string>(),
      Array<string>(),
    )

    const get = golang.createImportSection(groups);
    const want = 'first\n\nsecond\nthird';
    assert.equal(get, want)
  });
});
