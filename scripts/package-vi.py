"""Create auditable v1.1 archives without touching the frozen v1.0 release."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
out = root / 'dist'
out.mkdir(exist_ok=True)
version = json.loads((root / 'package.json').read_text())['version']
folders = ['.codex-plugin', '.claude-plugin', 'skills', 'assets', 'connections', 'src', 'public', 'test', 'submission']
names = ['README.md', 'LICENSE', '.mcp.json', 'package.json', 'package-lock.json', 'server.json', 'manifest.json', 'gemini-extension.json', 'GEMINI.md', 'glama.json', '.gitignore', 'scripts/package-vi.py', 'scripts/validate-live.mjs', 'scripts/validate-stdio.mjs', 'scripts/validate-vi-live.mjs']
paths = [root / x for x in names]
for folder in folders:
    paths.extend(p for p in (root / folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.name != 'deploy-vi.py')
assert len(paths) == len(set(paths))
archive = out / f'vultax-vi-{version}.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for path in sorted(paths):
        z.write(path, path.relative_to(root).as_posix())

# MCPB is self-contained: only the stdio runtime, assets and production deps.
bundle = out / f'vultax-vi-{version}.mcpb'
bundle_files = [root / x for x in ['manifest.json', 'package.json', 'package-lock.json', 'LICENSE', 'README.md']]
for folder in ['src', 'public', 'assets', 'node_modules']:
    bundle_files.extend(p for p in (root / folder).rglob('*') if p.is_file())
with zipfile.ZipFile(bundle, 'w', zipfile.ZIP_DEFLATED) as z:
    for path in sorted(bundle_files):
        z.write(path, path.relative_to(root).as_posix())
checksums = {}
for path in [archive, bundle]:
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None
        assert all(not n.startswith('/') and '..' not in Path(n).parts for n in z.namelist())
    checksums[path.name] = {'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
(out / f'SHA256SUMS-{version}.json').write_text(json.dumps(checksums, indent=2) + '\n')
print(json.dumps(checksums, indent=2))
