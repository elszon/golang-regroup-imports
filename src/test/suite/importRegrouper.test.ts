import * as assert from 'assert';
import * as vscode from 'vscode';
import * as regroup from '../../importRegrouper';
import * as groups from '../../groups';

suite('Regroup Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Default group ordering', () => {
        const get = regroup.GoImportsRegrouper.buildImportGroups();
        assert.equal(get.length, 4);
        assert.equal(get[0].g.priority(), (new groups.Std()).priority());
        assert.equal(get[1].g.priority(), (new groups.Blank()).priority());
        assert.equal(get[2].g.priority(), (new groups.Dot()).priority());
        assert.equal(get[3].g.priority(), (new groups.Default()).priority());
    });

    test('Custom group ordering', () => {
        const get = regroup.GoImportsRegrouper.buildImportGroups(new Array<groups.Group>(
            new groups.Std(), new groups.Prefix("first"), new groups.Prefix("second")
        ));
        assert.equal(get.length, 4);
        assert.equal(get[0].g.priority(), (new groups.Std()).priority());
        assert.equal(get[1].g.priority(), (new groups.Prefix("second")).priority());
        assert.equal(get[2].g.priority(), (new groups.Prefix("first")).priority());
        assert.equal(get[3].g.priority(), (new groups.Default()).priority());
    });


    test('Return default grouped imports', () => {
        const imports = [
            '"github.com/elszon/group-imports/internal/sort"',
            '"github.com/stretchr/testify/assert"',
            '"testing"',
        ];


        const r = new regroup.GoImportsRegrouper();
        const regrouped = r.group(imports)

        assert.deepEqual(regrouped[0], [
            '"testing"',
        ], "std should be equal");

        assert.deepEqual(regrouped[1], [
            '"github.com/elszon/group-imports/internal/sort"',
            '"github.com/stretchr/testify/assert"',
        ], "default should be equal");
    });

    test('Return project grouped imports', () => {
        const imports = [
            '"github.com/elszon/group-imports/internal/sort"',
            '"github.com/stretchr/testify/assert"',
            '"testing"',
        ];


        const r = new regroup.GoImportsRegrouper(new Array<groups.Group>(
            new groups.Std(), new groups.Default(), new groups.Prefix("github.com/elszon/group-imports")
        ));
        const regrouped = r.group(imports)

        assert.deepEqual(regrouped[0], [
            '"testing"',
        ], "std should be equal");

        assert.deepEqual(regrouped[1], [
            '"github.com/stretchr/testify/assert"',
        ], "default should be equal");

        assert.deepEqual(regrouped[2], [
            '"github.com/elszon/group-imports/internal/sort"',
        ], "project should be equal");
    });

    test('Return grouped mixed imports', () => {
        const imports = [
            '"github.com/blackdahila/package"',
            '"github.com/package/package"',
            '"math"',
            '"fmt"',
            'err "errors"',
            '"database/sql"',
            '"github.com/jmoiron/sqlx"',
            'test "github.com/blackdahila/testing"',
            '. "github.com/blackdahila/testing"',
            '_ "github.com/jmoiron/sqlx"',
        ];


        const r = new regroup.GoImportsRegrouper();
        const regrouped = r.group(imports)

        assert.deepEqual(regrouped[0], [
            '"math"',
            '"fmt"',
            'err "errors"',
            '"database/sql"',
        ], "std should be equal");

        assert.deepEqual(regrouped[1], [
            '"github.com/blackdahila/package"',
            '"github.com/package/package"',
            '"github.com/jmoiron/sqlx"',
            'test "github.com/blackdahila/testing"',
        ], "default should be equal");

        assert.deepEqual(regrouped[2], [
            '_ "github.com/jmoiron/sqlx"',
        ], "blank should be equal");

        assert.deepEqual(regrouped[3], [
            '. "github.com/blackdahila/testing"',
        ], "dot should be equal");
    });
});
