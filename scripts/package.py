"""Package source, including dotfiles/workflows, but excluding dependencies and secrets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
target = root.parent / 'math-typst-studio-source.zip'
excluded = {'node_modules', '.tools', '.venv', 'dist', 'outputs', '.git', '__pycache__'}
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for path in root.rglob('*'):
        rel = path.relative_to(root)
        if any(part in excluded for part in rel.parts) or not path.is_file():
            continue
        if path.name.startswith('.env') and path.name != '.env.example':
            continue
        if path.suffix == '.log':
            continue
        archive.write(path, Path(root.name) / rel)
    names = archive.namelist()
    assert 'math-typst-studio/.github/workflows/compile.yml' in names
    assert 'math-typst-studio/package-lock.json' in names
    assert not any(name.endswith('/.env') for name in names)
print(f'{target}: {target.stat().st_size:,} bytes, {len(names)} files')
