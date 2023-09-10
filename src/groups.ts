
export interface Group {
    priority(): number
    match(s: string): boolean
}

export class Std implements Group {
    priority(): number {
        return Number.MAX_VALUE - 2;
    }
    match(s: string): boolean {
        return !s.includes('.');
    }
}

export class Blank implements Group {
    priority(): number {
        return Number.MAX_VALUE - 1;
    }
    match(s: string): boolean {
        return s.startsWith('_ ');
    }
}

export class Dot implements Group {
    priority(): number {
        return Number.MAX_VALUE;
    }
    match(s: string): boolean {
        return s.startsWith('. ');
    }
}

export class Default implements Group {
    priority(): number {
        return Number.MIN_VALUE;
    }
    match(s: string): boolean {
        return true;
    }
}

export class Prefix implements Group {
    prefix: string

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    priority(): number {
        return this.prefix.length;
    }
    match(s: string): boolean {
        const i = s.indexOf('"');
        const idx = i < 0 ? 0 : i + 1
        const subs = s.slice(idx)
        return subs.startsWith(this.prefix);
    }
}
