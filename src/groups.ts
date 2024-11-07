
export interface Group {
    priority(): number
    match(s: string): boolean
}

const MAX_PRIORITY = 2000

export class Dot implements Group {
    priority(): number {
        return MAX_PRIORITY;
    }
    match(s: string): boolean {
        return s.startsWith('. ');
    }
}

export class Blank implements Group {
    priority(): number {
        return MAX_PRIORITY - 1;
    }
    match(s: string): boolean {
        return s.startsWith('_ ');
    }
}

export class Prefix implements Group {
    prefix: string

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    priority(): number {
        return MAX_PRIORITY / 2 + this.prefix.length;
    }
    match(s: string): boolean {
        const i = s.indexOf('"');
        const idx = i < 0 ? 0 : i + 1
        const subs = s.slice(idx)
        return subs.startsWith(this.prefix);
    }
}

export class Std implements Group {
    priority(): number {
        return MAX_PRIORITY / 2;
    }
    match(s: string): boolean {
        return !s.includes('.');
    }
}

export class Default implements Group {
    priority(): number {
        return 0;
    }
    match(s: string): boolean {
        return true;
    }
}
