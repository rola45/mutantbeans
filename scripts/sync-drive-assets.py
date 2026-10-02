"""Import public Drive images into the admin library; never deletes old files."""
import concurrent.futures, hashlib, json, re, subprocess, unicodedata
from pathlib import Path
from html.parser import HTMLParser
ROOT = Path(__file__).resolve().parents[1]
FOLDER = '14RLJEKMZFWFoLtiegImg8CB9QyW7YX_8'
DEST = ROOT / 'images' / 'drive-assets'
DEST.mkdir(parents=True, exist_ok=True)
class Listing(HTMLParser):
    def __init__(self): super().__init__(); self.items = {}
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); identifier = a.get('data-id'); label = a.get('data-tooltip', '')
        if not identifier or not re.fullmatch(r'[A-Za-z0-9_-]+', identifier): return
        if label.endswith(' Image'): self.items[identifier] = (label[:-6], False)
        elif label.endswith(' Shared folder'): self.items[identifier] = (label[:-14], True)
def listing(identifier):
    raw = subprocess.check_output(['curl','--fail','--silent','--show-error','--location',f'https://drive.google.com/drive/folders/{identifier}'])
    parser = Listing(); parser.feed(raw.decode('utf-8')); return parser.items
jobs=[]
def walk(identifier, group, seen):
    if identifier in seen: return
    seen.add(identifier)
    items = listing(identifier)
    if not items: raise RuntimeError(f'No se pudieron leer los archivos de {group}. Revisa el acceso público.')
    for file_id,(name,is_folder) in items.items():
        if is_folder: walk(file_id, name, seen)
        elif re.search(r'\.(png|jpe?g|webp)$', name, re.I): jobs.append((file_id,name,group))
walk(FOLDER, 'WEB ASSETS', set())
def download(job):
    identifier,name,group=job
    ext=Path(name).suffix.lower()
    slug=re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',Path(name).stem).encode('ascii','ignore').decode().lower()).strip('-')
    path=DEST / f'{slug}-{identifier}{ext}'
    temp=path.with_suffix(ext+'.tmp')
    subprocess.run(['curl','--fail','--silent','--show-error','--location','--max-time','90',f'https://drive.usercontent.google.com/download?id={identifier}&export=download', '-o',str(temp)],check=True)
    signature=temp.read_bytes()[:12]
    if not (signature.startswith(b'\x89PNG\r\n\x1a\n') or signature.startswith(b'\xff\xd8\xff') or (signature[:4]==b'RIFF' and signature[8:12]==b'WEBP')):
        temp.unlink(); raise RuntimeError(f'Drive no entregó una imagen para {name}.')
    temp.replace(path)
    role = ('Fondo · capa base' if name.lower() == 'don veneno fondo.png' else 'Personaje · capa transparente' if name.lower() == 'donveneno freddy.png' else 'Primer plano · capa transparente' if name.lower() == 'donveneno tabla.png' else 'Logotipo' if 'logo' in name.lower() else 'Imagen')
    return dict(id=identifier,name=name,group=group,role=role,path=path.relative_to(ROOT).as_posix(),source=f'https://drive.google.com/file/d/{identifier}/view',sha256=hashlib.sha256(path.read_bytes()).hexdigest())
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: assets=list(pool.map(download,jobs))
assets.sort(key=lambda a:(a['group'],a['name'].lower()))
manifest=dict(folder=f'https://drive.google.com/drive/folders/{FOLDER}',assets=assets)
(ROOT/'admin-worker/public/asset-library.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'Importadas {len(assets)} imágenes.')
for group in sorted({a['group'] for a in assets}):print(group, sum(a['group']==group for a in assets))
