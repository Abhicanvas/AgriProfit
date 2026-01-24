import json
from pathlib import Path

if not Path("gaps.json").exists():
    exit(0)

data = json.load(open("gaps.json"))

for gap in data.get("gaps", []):
    path = Path(gap["file"])
    if not path.exists():
        continue

    lines = path.read_text().splitlines()
    idx = max(0, min(len(lines), gap.get("line", 1) - 1))

    todo = f"# TODO (AI REVIEW - {gap['severity']}): {gap['message']}"
    lines.insert(idx, todo)

    path.write_text("\n".join(lines))
