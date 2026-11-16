"""One-time helper: moves the English text of ui/<page>/<page>.html into Fluent files.

    python3 tools/extract_strings.py welcome settings newtab

Every element whose content is plain text gets a data-l10n-id, and its text (with its title,
aria-label, placeholder or alt) goes into ui/locales/en-US/astrelle/<page>.ftl word for word, so
English looks exactly as before. Elements that hold text around other elements are listed for
hand-editing.
"""
import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATTRS = ("title", "aria-label", "placeholder", "alt")


def slug(text, taken, page):
    words = re.findall(r"[a-z0-9]+", text.lower())[:5] or ["text"]
    base = f"{page}-" + "-".join(words)
    name, n = base, 2
    while name in taken:
        name, n = f"{base}-{n}", n + 1
    taken.add(name)
    return name


def ftl_text(text):
    text = html.unescape(re.sub(r"\s+", " ", text.strip()))
    text = text.replace("{", '{"{"}').replace("}", '{"}"}')
    if text[:1] in "[*.":
        text = '{""}' + text
    return text


def convert(page):
    path = os.path.join(ROOT, "ui", page, f"{page}.html")
    src = open(path, encoding="utf-8").read()
    taken, entries = set(), []

    def attrs_of(attr_text):
        found = {}
        for name in ATTRS:
            m = re.search(rf'\s{name}="([^"]*[A-Za-z][^"]*)"', attr_text)
            if m:
                found[name] = m.group(1)
        return found

    def text_element(m):
        tag, attr_text, text = m.group(1), m.group(2), m.group(3)
        if "data-l10n-id" in attr_text or tag in ("script", "style", "title", "option") and tag != "option" or not re.search("[A-Za-z]", text):
            return m.group(0)
        if tag == "title":
            return m.group(0)
        name = slug(text, taken, page)
        entries.append((name, ftl_text(text), {k: ftl_text(v) for k, v in attrs_of(attr_text).items()}))
        return f'<{tag}{attr_text} data-l10n-id="{name}">{text}</{tag}>'

    body_start = src.index("<body")
    head, body = src[:body_start], src[body_start:]
    body = re.sub(r"<script\b.*?</script>", lambda m: m.group(0).replace("<", "\0"), body, flags=re.S)
    body = re.sub(r"<([a-z0-9]+)((?:\s[^<>]*?)?)>([^<>]*)</\1>", text_element, body)

    def attr_only(m):
        tag, attr_text = m.group(1), m.group(2)
        if "data-l10n-id" in attr_text or tag in ("html", "link", "meta"):
            return m.group(0)
        found = attrs_of(attr_text)
        if not found:
            return m.group(0)
        name = slug(" ".join(found.values()), taken, page)
        entries.append((name, None, {k: ftl_text(v) for k, v in found.items()}))
        return f'<{tag}{attr_text} data-l10n-id="{name}">'

    body = re.sub(r"<([a-z0-9]+)(\s[^<>]*?)/?>", attr_only, body)
    body = body.replace("\0", "<")
    title = re.search(r"<title>([^<]*)</title>", head)
    if title:
        entries.insert(0, (f"{page}-page-title", ftl_text(title.group(1)), {}))
        head = head.replace(title.group(0), f'<title data-l10n-id="{page}-page-title">{title.group(1)}</title>')
    head = head.replace("</head>", f'  <link rel="localization" href="astrelle/{page}.ftl">\n</head>', 1) if "astrelle/" + page not in head else head

    leftovers = []
    for m in re.finditer(r"<([a-z0-9]+)((?:\s[^<>]*?)?)>((?:(?!</\1>).)*?)</\1>", body, flags=re.S):
        inner = m.group(3)
        loose = re.sub(r"<[^>]+>[^<]*</[^>]+>|<[^>]+>", "", inner)
        if "data-l10n-id" not in m.group(2) and re.search(r"[A-Za-z]{2}", loose) and not m.group(1) in ("script", "style"):
            leftovers.append(re.sub(r"\s+", " ", m.group(0))[:140])
    open(path, "w", encoding="utf-8").write(head + body)
    out = os.path.join(ROOT, "ui", "locales", "en-US", "astrelle", f"{page}.ftl")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(f"# Astrelle: {page}. English is the source; other languages translate these.\n\n")
        for name, value, attributes in entries:
            f.write(f"{name} =" + (f" {value}" if value else "") + "\n")
            for attr, text in attributes.items():
                f.write(f"    .{attr} = {text}\n")
    print(f"{page}: {len(entries)} strings; {len(leftovers)} mixed elements to do by hand")
    for line in leftovers:
        print("   ", line)


if __name__ == "__main__":
    for page in sys.argv[1:]:
        convert(page)
