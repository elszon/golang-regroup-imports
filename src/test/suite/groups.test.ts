import * as assert from 'assert';
import * as groups from '../../groups';

suite('Groups Test Suite', () => {
    test('Match std imports', () => {
        const ok = Array<string>(
            `"net/http"`,
            `"fmt"`
        )
        for (const tc of ok) {
            const b = new groups.Std();
            assert.ok(b.match(tc))
        }
    });

    test('Match blank imports', () => {
        const ok = Array<string>(
            `_ "ok"`,
            `_ "github.com/asdf"`
        )
        for (const tc of ok) {
            const b = new groups.Blank();
            assert.ok(b.match(tc))
        }
    });

    test('Match dot imports', () => {
        const ok = Array<string>(
            `. "ok"`,
            `. "github.com/asdf"`
        )
        for (const tc of ok) {
            const b = new groups.Dot();
            assert.ok(b.match(tc))
        }
    });

    test('Match prefix imports', () => {
        const ok = Array<string>(
            `ok "github.com/asdf"`,
            `"github.com/asdf"`,
            `ok "github.com/asdf/asdfasdf"`,
            `"github.com/asdf/asdfasdf"`
        )
        for (const tc of ok) {
            const b = new groups.Prefix("github.com/asdf");
            assert.ok(b.match(tc))
        }
    });
});
