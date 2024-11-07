import * as groups from './groups';

export type OrderedGroups = {
    g: groups.Group;
    id: number;
}

// Group import to two or more groups. Groups are stdlib + third party + passed in constructor.
export class GoImportsRegrouper {

    private importGroups: { g: groups.Group, id: number }[];

    constructor(g?: groups.Group[]) {
        this.importGroups = GoImportsRegrouper.buildImportGroups(g)
    }

    static buildImportGroups(g?: groups.Group[]) {
        const importGroups = (() => {
            if (g) {
                const importGr = new Array<OrderedGroups>();
                const hasDefaultGroup = !!g.find(gg => gg.priority() === (new groups.Default()).priority())
                if (!hasDefaultGroup) {
                    g.push(new groups.Default())
                }
                for (let i = 0; i < g.length; i++) {
                    const og: OrderedGroups = { g: g[i], id: Number(i) };
                    importGr.push(og)
                }
                return importGr
            } else {
                return new Array<OrderedGroups>(
                    { g: new groups.Std(), id: 0 },
                    { g: new groups.Default(), id: 1 },
                    { g: new groups.Blank(), id: 2 },
                    { g: new groups.Dot(), id: 3 },
                )
            }
        })();

        importGroups.sort((l, r) => (r.g.priority() - l.g.priority()));

        return importGroups
    }

    public group(lines: string[]) {
        const regrouped = new Array<string[]>(this.importGroups.length)
            .fill([]).map(() => new Array<string>());

        for (const line of lines) {
            const trimLine = line.trim()
            if (trimLine.length === 0) {
                continue
            }
            for (const g of this.importGroups) {
                if (g.g.match(trimLine)) {
                    regrouped[g.id].push(line);
                    break;
                }
            }
        }

        return regrouped;
    }
}
