"""Compile the generated, validated native Typst source to actual output files."""
from pathlib import Path
import sys

local = Path(__file__).resolve().parents[1] / '.tools' / 'python'
if local.exists():
    sys.path.insert(0, str(local))
import typst

source = Path(sys.argv[1] if len(sys.argv) > 1 else 'outputs/figure.typ').resolve()
for extension in ('pdf', 'svg', 'png'):
    target = source.with_suffix('.' + extension)
    data = typst.compile(str(source), format=extension, root=str(source.parent), **({'ppi': 216} if extension == 'png' else {}))
    if isinstance(data, list):
        if len(data) != 1:
            raise RuntimeError(f'Expected one page, got {len(data)}')
        data = data[0]
    target.write_bytes(data)
    print(f'{target.name}: {len(data):,} bytes')
