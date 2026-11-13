"""Dependency-free structural checks; these do not replace browser QA."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import json
from urllib.parse import unquote, urlsplit

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.links, self.assets, self.labels = [], [], [], []
        self.services = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag == 'a': self.links.append(a.get('href', ''))
        if tag in ('img', 'script') and a.get('src'): self.assets.append(a['src'])
        if tag == 'link' and a.get('rel') == 'stylesheet': self.assets.append(a['href'])
        if tag == 'img': assert 'alt' in a, 'Image missing alt'

page = Page()
source = Path('index.html').read_text(encoding='utf-8')
page.feed(source)
duplicates = [key for key,count in Counter(page.ids).items() if count > 1]
assert not duplicates, duplicates
for link in page.links:
    if link.startswith('#') and len(link) > 1:
        assert link[1:] in page.ids, f'Broken fragment {link}'
for asset in page.assets:
    if not urlsplit(asset).scheme:
        assert Path(unquote(asset)).is_file(), f'Missing asset {asset}'
assert source.count('<h1 ') == 1
assert source.count('class="case-study"') == 2
assert len(page.ids) == len(set(page.ids))
for title in ['Carrio', 'Enterprise data platforms', 'Trillion Data Labs', 'LevelUp', 'RidersGuild', 'BT Collections', 'G&S Construction', 'Side by Side Tailoring', 'FitX100']:
    assert title in source, f'Missing project {title}'
assert 'id="scene"' in source and 'id="architecture"' in source
assert '<form id="contact-form"' in source
data = json.loads(Path('project-content.json').read_text(encoding='utf-8'))
assert len(data['projects']) == 9
print(f'PASS: unique IDs ({len(page.ids)}), internal navigation, local assets ({len(page.assets)}), project preservation, case study structure, editorial JSON.')
print('NOT TESTED: external URL availability, rendering, responsive widths, browser console, actual mail app delivery, Lighthouse.')
