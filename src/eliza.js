class EString {
  static digits = "0123456789";

  static amatch(str, pat) {
    let count = 0;
    let i = 0;
    let j = 0;

    while (i < str.length && j < pat.length) {
      const p = pat[j];
      if (p === "*" || p === "#") return count;
      if (str[i] !== p) return -1;
      i += 1;
      j += 1;
      count += 1;
    }

    return count;
  }

  static findPat(str, pat) {
    for (let i = 0; i < str.length; i += 1) {
      if (EString.amatch(str.slice(i), pat) >= 0) return i;
    }
    return -1;
  }

  static findNum(str) {
    let count = 0;
    for (let i = 0; i < str.length; i += 1) {
      if (!EString.digits.includes(str[i])) return count;
      count += 1;
    }
    return count;
  }

  static match(str, pat, matches) {
    let i = 0;
    let j = 0;
    let pos = 0;

    while (pos < pat.length && j < matches.length) {
      const p = pat[pos];

      if (p === "*") {
        let n;
        if (pos + 1 === pat.length) {
          n = str.length - i;
        } else {
          n = EString.findPat(str.slice(i), pat.slice(pos + 1));
        }
        if (n < 0) return false;
        matches[j] = str.slice(i, i + n);
        j += 1;
        i += n;
        pos += 1;
      } else if (p === "#") {
        const n = EString.findNum(str.slice(i));
        matches[j] = str.slice(i, i + n);
        j += 1;
        i += n;
        pos += 1;
      } else {
        const n = EString.amatch(str.slice(i), pat.slice(pos));
        if (n <= 0) return false;
        i += n;
        pos += n;
      }
    }

    return i >= str.length && pos >= pat.length;
  }

  static translateChars(str, src, dest) {
    if (src.length !== dest.length) {
      throw new Error("translateChars(): src and dest must have the same length");
    }

    let result = str;
    for (let i = 0; i < src.length; i += 1) {
      result = result.split(src[i]).join(dest[i]);
    }
    return result;
  }

  static compress(s) {
    if (s.length === 0) return s;

    let dest = "";
    let c = s[0];

    for (let i = 1; i < s.length; i += 1) {
      const next = s[i];
      if (c === " " && (next === " " || next === "," || next === ".")) {
        // drop duplicated/obsolete space
      } else if (c !== " " && next === "?") {
        dest += `${c} `;
      } else {
        dest += c;
      }
      c = next;
    }

    return dest + c;
  }

  static trim(s) {
    for (let i = 0; i < s.length; i += 1) {
      if (s[i] !== " ") return s.slice(i);
    }
    return "";
  }

  static pad(s) {
    if (s.length === 0) return " ";

    const first = s[0];
    const last = s[s.length - 1];

    if (first === " " && last === " ") return s;
    if (first === " " && last !== " ") return `${s} `;
    if (first !== " " && last === " ") return ` ${s}`;
    return ` ${s} `;
  }

  static count(s, char) {
    let count = 0;
    for (const current of s) {
      if (current === char) count += 1;
    }
    return count;
  }
}

class WordList {
  constructor() {
    this.words = [];
  }

  add(word) {
    this.words.push(word);
  }

  clear() {
    this.words = [];
  }

  find(word) {
    return this.words.includes(word);
  }

  get size() {
    return this.words.length;
  }

  at(index) {
    return this.words[index];
  }
}

class PrePostList {
  constructor() {
    this.items = [];
  }

  add(src, dest) {
    this.items.push({ src, dest });
  }

  clear() {
    this.items = [];
  }

  xlate(str) {
    const item = this.items.find((entry) => entry.src === str);
    return item ? item.dest : str;
  }

  translate(s) {
    let work = EString.trim(s);
    let output = "";
    const lines = ["", ""];

    while (EString.match(work, "* *", lines)) {
      output += `${this.xlate(lines[0])} `;
      work = EString.trim(lines[1]);
    }

    return output + this.xlate(work);
  }
}

class ReasembList {
  constructor() {
    this.rules = [];
  }

  add(rule) {
    this.rules.push(rule);
  }

  get size() {
    return this.rules.length;
  }

  at(index) {
    return this.rules[index];
  }
}

class Decomp {
  constructor(pattern, mem, reasemb) {
    this.pattern = pattern;
    this.mem = mem;
    this.reasemb = reasemb;
    this.currReasmb = 100;
  }

  nextRule() {
    if (this.reasemb.size === 0) return null;
    return this.reasemb.at(this.currReasmb);
  }

  stepRule() {
    const size = this.reasemb.size;
    if (size === 0) return;

    if (this.mem) {
      this.currReasmb = Math.floor(Math.random() * size);
    }

    this.currReasmb += 1;
    if (this.currReasmb >= size) this.currReasmb = 0;
  }
}

class DecompList {
  constructor() {
    this.items = [];
  }

  add(pattern, mem, reasemb) {
    this.items.push(new Decomp(pattern, mem, reasemb));
  }

  get size() {
    return this.items.length;
  }

  at(index) {
    return this.items[index];
  }
}

class Key {
  constructor(key = null, rank = 0, decomp = new DecompList()) {
    this.key = key;
    this.rank = rank;
    this.decomp = decomp;
  }
}

class KeyList {
  constructor() {
    this.items = [];
  }

  add(key, rank, decomp) {
    this.items.push(new Key(key, rank, decomp));
  }

  clear() {
    this.items = [];
  }

  getKey(value) {
    return this.items.find((item) => item.key === value) ?? null;
  }

  buildKeyStack(stack, s) {
    stack.reset();
    let work = EString.trim(s);
    const lines = ["", ""];

    while (EString.match(work, "* *", lines)) {
      const key = this.getKey(lines[0]);
      if (key) stack.pushKey(key);
      work = lines[1];
    }

    const key = this.getKey(work);
    if (key) stack.pushKey(key);
  }
}

class KeyStack {
  constructor() {
    this.items = [];
    this.stackSize = 20;
  }

  reset() {
    this.items = [];
  }

  pushKey(key) {
    if (!key || this.items.length >= this.stackSize) return;

    let insertAt = this.items.length;
    while (insertAt > 0 && key.rank > this.items[insertAt - 1].rank) {
      insertAt -= 1;
    }
    this.items.splice(insertAt, 0, key);
  }

  get keyTop() {
    return this.items.length;
  }

  at(index) {
    return this.items[index] ?? null;
  }
}

class Mem {
  constructor() {
    this.items = [];
    this.memMax = 20;
  }

  save(str) {
    if (this.items.length < this.memMax) this.items.push(str);
  }

  get() {
    return this.items.shift() ?? null;
  }
}

class SynList {
  constructor() {
    this.items = [];
  }

  add(words) {
    this.items.push(words);
  }

  clear() {
    this.items = [];
  }

  find(word) {
    return this.items.find((list) => list.find(word)) ?? null;
  }

  matchDecomp(str, pat, lines) {
    const synParts = ["", "", ""];

    if (!EString.match(pat, "*@* *", synParts)) {
      return EString.match(str, pat, lines);
    }

    const first = synParts[0];
    const synWord = synParts[1];
    const rest = ` ${synParts[2]}`;
    const synonyms = this.find(synWord);

    if (!synonyms) return false;

    for (let i = 0; i < synonyms.size; i += 1) {
      const modifiedPattern = first + synonyms.at(i) + rest;

      if (EString.match(str, modifiedPattern, lines)) {
        const n = EString.count(first, "*");
        for (let j = lines.length - 2; j >= n; j -= 1) {
          lines[j + 1] = lines[j];
        }
        lines[n] = synonyms.at(i);
        return true;
      }
    }

    return false;
  }
}

export class Eliza {
  constructor() {
    this.keys = new KeyList();
    this.syns = new SynList();
    this.pre = new PrePostList();
    this.post = new PrePostList();
    this.quit = new WordList();
    this.keyStack = new KeyStack();
    this.mem = new Mem();
    this.lastDecomp = null;
    this.lastReasemb = null;
    this.initial = "Hello.";
    this.final = "Goodbye.";
    this.finished = false;
  }

  readScript(scriptText) {
    this.clearScript();
    const lines = scriptText.replace(/\r\n?/g, "\n").split("\n");

    for (const line of lines) {
      this.collect(line);
    }

    return true;
  }

  clearScript() {
    this.keys.clear();
    this.syns.clear();
    this.pre.clear();
    this.post.clear();
    this.quit.clear();
    this.keyStack.reset();
    this.mem = new Mem();
    this.lastDecomp = null;
    this.lastReasemb = null;
    this.initial = "";
    this.final = "";
    this.finished = false;
  }

  collect(line) {
    const s = line.trim();
    if (s.length === 0 || s.startsWith("#")) return;

    if (s.startsWith("reasmb:")) {
      if (!this.lastReasemb) return;
      this.lastReasemb.add(s.slice("reasmb:".length).trimStart());
      return;
    }

    if (s.startsWith("decomp:")) {
      if (!this.lastDecomp) return;

      this.lastReasemb = new ReasembList();
      let pattern = s.slice("decomp:".length).trimStart();
      let mem = false;

      if (pattern.startsWith("$ ")) {
        mem = true;
        pattern = pattern.slice(2);
      }

      this.lastDecomp.add(pattern, mem, this.lastReasemb);
      return;
    }

    if (s.startsWith("key:")) {
      const rest = s.slice("key:".length).trim();
      const parts = rest.split(/\s+/);
      const maybeRank = Number.parseInt(parts[parts.length - 1], 10);
      const hasRank = Number.isInteger(maybeRank) && String(maybeRank) === parts[parts.length - 1];
      const rank = hasRank ? maybeRank : 0;
      const key = hasRank ? parts.slice(0, -1).join(" ") : rest;

      this.lastDecomp = new DecompList();
      this.lastReasemb = null;
      this.keys.add(key, rank, this.lastDecomp);
      return;
    }

    if (s.startsWith("synon:")) {
      const words = new WordList();
      for (const word of s.slice("synon:".length).trim().split(/\s+/)) {
        words.add(word);
      }
      this.syns.add(words);
      return;
    }

    if (s.startsWith("pre:")) {
      const [src, ...destParts] = s.slice("pre:".length).trim().split(/\s+/);
      this.pre.add(src, destParts.join(" "));
      return;
    }

    if (s.startsWith("post:")) {
      const [src, ...destParts] = s.slice("post:".length).trim().split(/\s+/);
      this.post.add(src, destParts.join(" "));
      return;
    }

    if (s.startsWith("initial:")) {
      this.initial = s.slice("initial:".length).trimStart();
      return;
    }

    if (s.startsWith("final:")) {
      this.final = s.slice("final:".length).trimStart();
      return;
    }

    if (s.startsWith("quit:")) {
      this.quit.add(` ${s.slice("quit:".length).trim()} `);
    }
  }

  processInput(input) {
    let s = input;
    let reply;

    s = EString.translateChars(s, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz");
    s = EString.translateChars(s, "@#$%^&*()_-+=~`{[}]|:;<>\\\"", "                          ");
    s = EString.translateChars(s, ",?!", "...");
    s = EString.compress(s);

    const lines = ["", ""];
    while (EString.match(s, "*.*", lines)) {
      reply = this.sentence(lines[0]);
      if (reply !== null) return reply;
      s = EString.trim(lines[1]);
    }

    if (s.length !== 0) {
      reply = this.sentence(s);
      if (reply !== null) return reply;
    }

    const memory = this.mem.get();
    if (memory !== null) return memory;

    const xnone = this.keys.getKey("xnone");
    if (xnone !== null) {
      reply = this.decompose(xnone, s, { key: null });
      if (reply !== null) return reply;
    }

    return "I am at a loss for words.";
  }

  sentence(s) {
    let sentence = this.pre.translate(s);
    sentence = EString.pad(sentence);

    if (this.quit.find(sentence)) {
      this.finished = true;
      return this.final;
    }

    this.keys.buildKeyStack(this.keyStack, sentence);

    for (let i = 0; i < this.keyStack.keyTop; i += 1) {
      const gotoRef = { key: null };
      let reply = this.decompose(this.keyStack.at(i), sentence, gotoRef);
      if (reply !== null) return reply;

      while (gotoRef.key !== null) {
        const gotoKey = gotoRef.key;
        gotoRef.key = null;
        reply = this.decompose(gotoKey, sentence, gotoRef);
        if (reply !== null) return reply;
      }
    }

    return null;
  }

  decompose(key, s, gotoRef) {
    if (!key) return null;

    for (let i = 0; i < key.decomp.size; i += 1) {
      const decomp = key.decomp.at(i);
      const replyParts = Array(10).fill("");

      if (this.syns.matchDecomp(s, decomp.pattern, replyParts)) {
        const reply = this.assemble(decomp, replyParts, gotoRef);
        if (reply !== null) return reply;
        if (gotoRef.key !== null) return null;
      }
    }

    return null;
  }

  assemble(decomp, replyParts, gotoRef) {
    decomp.stepRule();
    const rule = decomp.nextRule();

    if (rule === null) return null;

    const gotoLines = ["", ""];
    if (EString.match(rule, "goto *", gotoLines)) {
      gotoRef.key = this.keys.getKey(gotoLines[0]);
      return null;
    }

    let work = "";
    let currentRule = rule;
    const lines = ["", "", ""];

    while (EString.match(currentRule, "* (#)*", lines)) {
      currentRule = lines[2];
      const n = Number.parseInt(lines[1], 10) - 1;

      if (!Number.isInteger(n) || n < 0 || n >= replyParts.length) return null;

      replyParts[n] = this.post.translate(replyParts[n]);
      work += `${lines[0]} ${replyParts[n]}`;
    }

    work += currentRule;

    if (decomp.mem) {
      this.mem.save(work);
      return null;
    }

    return work;
  }
}
