#!/usr/bin/env python3
"""Render the homepage's English or Spanish route as crawlable static HTML."""
from __future__ import annotations

import argparse
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def language_map(source: str) -> dict[str, str]:
    match = re.search(r'const translations = (\{.*?\});', source, re.S)
    if not match:
        raise SystemExit('Homepage translation dictionary not found')
    return json.loads(match.group(1))


class Localizer(HTMLParser):
    def __init__(self, language: str, translations: dict[str, str]):
        super().__init__(convert_charrefs=True)
        self.language = language
        self.translations = translations
        self.reverse = {}
        for spanish, english in translations.items():
            self.reverse.setdefault(english, spanish)
        self.output: list[str] = []
        self.raw_text_tag: str | None = None

    def translated(self, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            return value
        if self.language == 'en':
            result = self.translations.get(stripped) or self.translations.get(stripped.replace('’', "'").replace('‘', "'")) or stripped
        else:
            result = self.reverse.get(stripped, stripped)
        return value.replace(stripped, result, 1)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        raw = self.get_starttag_text()
        if tag == 'html':
            raw = re.sub(r'\blang\s*=\s*(["\']).*?\1', f'lang="{self.language}"', raw, count=1, flags=re.I)
        pattern = re.compile(r'(?i)(\b(?:aria-label|title|alt)\s*=\s*)(["\'])(.*?)\2')

        def replace_attribute(match: re.Match[str]) -> str:
            value = html.unescape(match.group(3))
            translated = self.translated(value)
            return f'{match.group(1)}{match.group(2)}{html.escape(translated, quote=True)}{match.group(2)}'

        raw = pattern.sub(replace_attribute, raw)
        self.output.append(raw)
        if tag in {'script', 'style'}:
            self.raw_text_tag = tag

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if self.raw_text_tag == tag:
            self.raw_text_tag = None

    def handle_endtag(self, tag: str) -> None:
        self.output.append(f'</{tag}>')
        if self.raw_text_tag == tag:
            self.raw_text_tag = None

    def handle_data(self, data: str) -> None:
        self.output.append(data if self.raw_text_tag else html.escape(self.translated(data), quote=False))

    def handle_entityref(self, name: str) -> None:
        self.output.append(f'&{name};')

    def handle_charref(self, name: str) -> None:
        self.output.append(f'&#{name};')

    def handle_comment(self, data: str) -> None:
        self.output.append(f'<!--{data}-->')

    def handle_decl(self, decl: str) -> None:
        self.output.append(f'<!{decl}>')

    def unknown_decl(self, data: str) -> None:
        self.output.append(f'<![{data}]>')


def update_meta(page: str, name: str, content: str, *, prop: bool = False) -> str:
    attribute = 'property' if prop else 'name'
    pattern = re.compile(rf'(<meta\s+{attribute}="{re.escape(name)}"\s+content=")[^"]*(")', re.I)
    updated, count = pattern.subn(lambda match: match.group(1) + html.escape(content, quote=True) + match.group(2), page, count=1)
    if count != 1:
        raise SystemExit(f'Missing metadata field: {name}')
    return updated


def build(language: str) -> Path:
    source = (ROOT / 'index.html').read_text()
    translations = language_map(source)
    parser = Localizer(language, translations)
    parser.feed(source)
    page = re.sub(r'(?m)^[\t ]+$', '', ''.join(parser.output))

    if language == 'en':
        title = 'Mutant Beans | Funk Rock from Ensenada, Mexico'
        description = 'Official website of Mutant Beans, an independent band from Ensenada, Baja California, blending funk-rock, hip-hop, thrash, punk and hardcore. Music, members, shows and news.'
        og_title = 'Mutant Beans | Funk Rock from Ensenada'
        og_description = 'Official website of Mutant Beans: funk-rock, hip-hop, thrash, punk and hardcore from Ensenada, Baja California. Discover their music, members and upcoming shows.'
        canonical = 'https://mutantbeans.com/'
        target = ROOT / 'index.html'
        other_language = 'ES'
        button_label = 'Switch to Spanish'
        route_replacements = []
    else:
        title = 'Mutant Beans | Banda de funk rock de Ensenada, México'
        description = 'Sitio oficial de Mutant Beans, banda independiente de Ensenada, Baja California. Funk-rock, hip-hop, thrash, punk y hardcore. Música, integrantes, fechas y noticias.'
        og_title = 'Mutant Beans | Funk rock de Ensenada'
        og_description = 'Sitio oficial de Mutant Beans: funk-rock, hip-hop, thrash, punk y hardcore de Ensenada, Baja California. Conoce su música, integrantes y próximas fechas.'
        canonical = 'https://mutantbeans.com/es/'
        target = ROOT / 'es' / 'index.html'
        other_language = 'EN'
        button_label = 'Cambiar a inglés'
        route_replacements = [('/press/', '/es/prensa/'), ('/shows/', '/es/fechas/'), ('/story/', '/es/historia/')]

    page = re.sub(r'<title>.*?</title>', f'<title>{html.escape(title)}</title>', page, count=1, flags=re.S)
    page = re.sub(r'(<link\s+rel="canonical"\s+href=")[^"]*(")', lambda m: m.group(1) + canonical + m.group(2), page, count=1)
    page = update_meta(page, 'description', description)
    page = update_meta(page, 'og:locale', 'en_US' if language == 'en' else 'es_MX', prop=True)
    page = update_meta(page, 'og:locale:alternate', 'es_MX' if language == 'en' else 'en_US', prop=True)
    page = update_meta(page, 'og:url', canonical, prop=True)
    page = update_meta(page, 'og:title', og_title, prop=True)
    page = update_meta(page, 'og:description', og_description, prop=True)
    page = update_meta(page, 'twitter:title', og_title)
    page = update_meta(page, 'twitter:description', og_description)
    page = re.sub(r'(<button\b[^>]*data-language-toggle[^>]*aria-label=")[^"]*("[^>]*title=")[^"]*("[^>]*>).*?(</button>)', lambda m: m.group(1) + button_label + m.group(2) + button_label + m.group(3) + other_language + m.group(4), page, count=1, flags=re.S)
    for original, localized in route_replacements:
        page = page.replace(f'href="{original}"', f'href="{localized}"')
    page = page.replace('src="images/', 'src="/images/').replace('href="images/', 'href="/images/')
    page = page.replace('src="site-content.js"', 'src="/site-content.js"')
    page = page.replace('src="assets/motion-effects.js"', 'src="/assets/motion-effects.js"')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(page)
    return target


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('language', choices=['en', 'es'])
    args = parser.parse_args()
    print(f'Generated {build(args.language)}')
