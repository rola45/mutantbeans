import { readFileSync, writeFileSync } from 'node:fs';

for (const [language, output] of [['en', 'index.html'], ['es', 'es/index.html']]) {
  const directory = new URL(`../src/homepage/${language}/`, import.meta.url);
  const read = (name) => readFileSync(new URL(name, directory), 'utf8');
  const html = read('layout.html').replace(/<!-- section:([\w-]+) -->/g,
    (_, name) => read(`${name}.html`).replace(/\n$/, ''));
  writeFileSync(new URL(`../${output}`, import.meta.url), html);
}
