"""One-time helper, after extract_strings.py: the text that sits around other elements.

A sentence with keys or bold words in it becomes one message with that markup (Fluent lets the
translation reorder it); text beside inputs, pictures or icons is wrapped in a span of its own.
"""
import html as H
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "path"}
INLINE = {"kbd", "b", "i", "em", "span", "code", "strong"}
SENTENCE = {"li", "small", "legend", "span"}


class Node:
    def __init__(self, tag, attrs, start, open_end, parent):
        self.tag, self.attrs, self.start, self.open_end, self.parent = tag, attrs, start, open_end, parent
        self.end, self.children = None, []


class Tree(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.lines = [0]
        for m in re.finditer("\n", src):
            self.lines.append(m.end())
        self.root = Node("#root", {}, 0, 0, None)
        self.cur = self.root
        self.feed(src)

    def pos(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self.pos()
        node = Node(tag, dict(attrs), start, start + len(self.get_starttag_text()), self.cur)
        self.cur.children.append(node)
        if tag in VOID:
            node.end = node.open_end
        else:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        start = self.pos()
        node = Node(tag, dict(attrs), start, start + len(self.get_starttag_text()), self.cur)
        node.end = node.open_end
        self.cur.children.append(node)

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is self.root:
            return
        end = self.src.index(">", self.pos()) + 1
        while self.cur is not n:
            self.cur.end = self.cur.end or end
            self.cur = self.cur.parent
        n.end = end
        self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(("text", self.pos(), data))

    def handle_entityref(self, name):
        self.cur.children.append(("text", self.pos(), f"&{name};"))


def ancestors_have_id(node):
    while node:
        if isinstance(node, Node) and "data-l10n-id" in node.attrs:
            return True
        node = node.parent
    return False


def has_letters(text):
    return re.search(r"[A-Za-z]{2}", text)


def slug(text, taken, page):
    words = re.findall(r"[a-z0-9]+", re.sub(r"<[^>]+>", " ", text).lower())[:5] or ["text"]
    base, n = f"{page}-" + "-".join(words), 2
    name = base
    while name in taken:
        name, n = f"{base}-{n}", n + 1
    taken.add(name)
    return name


def run(page):
    path = os.path.join(ROOT, "ui", page, f"{page}.html")
    ftl = os.path.join(ROOT, "ui", "locales", "en-US", "astrelle", f"{page}.ftl")
    src = open(path, encoding="utf-8").read()
    ftl_text = open(ftl, encoding="utf-8").read()
    taken = set(re.findall(r"^([a-z0-9-]+) =", ftl_text, flags=re.M))
    new_entries, dropped = [], set()

    # 1. Sentences with markup in them.
    edits = []
    def visit(node):
        for child in node.children:
            if isinstance(child, Node):
                if (child.tag in SENTENCE and "data-l10n-id" not in child.attrs and not ancestors_have_id(child.parent)
                        and any(isinstance(c, tuple) and has_letters(c[2]) for c in child.children)
                        and all(isinstance(c, tuple) or (c.tag in INLINE and all(isinstance(g, tuple) for g in c.children)) for c in child.children)
                        and any(isinstance(c, Node) for c in child.children)):
                    inner = src[child.open_end:child.end - len(f"</{child.tag}>")]
                    dropped.update(re.findall(r'\sdata-l10n-id="([^"]+)"', inner))
                    clean = re.sub(r'\sdata-l10n-id="[^"]+"', "", inner)
                    message = re.sub(r"<(\w+)\s[^>]*>", r"<\1>", re.sub(r"\s+", " ", clean).strip())
                    name = slug(message, taken, page)
                    new_entries.append((name, H.unescape(message)))
                    edits.append((child.start, child.end, src[child.start:child.open_end - 1] + f' data-l10n-id="{name}">' + clean + f"</{child.tag}>"))
                else:
                    visit(child)
    tree = Tree(src)
    visit(tree.root)
    for start, end, text in sorted(edits, reverse=True):
        src = src[:start] + text + src[end:]

    # 2. Loose text beside inputs, pictures and icons.
    tree = Tree(src)
    wraps = []
    def loose(node):
        for child in node.children:
            if isinstance(child, Node):
                if child.tag not in ("script", "style", "title", "head") and "data-l10n-id" not in child.attrs:
                    loose(child)
            elif has_letters(child[2]):
                wraps.append((node, child))
    loose(tree.root)
    for parent, (_, at, text) in sorted(wraps, key=lambda w: -w[1][1]):
        stripped = text.strip()
        lead = text[: len(text) - len(text.lstrip())]
        name = slug(stripped, taken, page)
        new_entries.append((name, H.unescape(re.sub(r"\s+", " ", stripped))))
        src = src[:at] + lead + f'<span data-l10n-id="{name}">{stripped}</span>' + text[len(lead) + len(stripped):] + src[at + len(text):]

    open(path, "w", encoding="utf-8").write(src)
    blocks = re.split(r"\n(?=[a-z0-9-]+ =)", ftl_text)
    kept = [b for b in blocks if not (re.match(r"([a-z0-9-]+) =", b) and re.match(r"([a-z0-9-]+) =", b).group(1) in dropped)]
    ftl_text = "\n".join(kept).rstrip("\n") + "\n"
    for name, value in reversed(new_entries) if False else new_entries:
        value = value.replace("{", '{"{"}').replace("}", '{"}"}')
        ftl_text += f"{name} = {value}\n"
    open(ftl, "w", encoding="utf-8").write(ftl_text)
    print(f"{page}: {len(edits)} sentences with markup, {len(wraps)} wrapped, {len(dropped)} nested ids folded in")


for page in sys.argv[1:]:
    run(page)
