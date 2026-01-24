import json
from pathlib import Path

data = json.load(open("gaps.json"))

for gap in data.get("gaps", []):
    path = Path(gap["file"])
    if not path.exists():
        continue

    lines = path.read_text().splitlines()
    idx = max(0, min(len(lines), gap["line"] - 1))

    todo = f"# TODO (AI REVIEW - {gap['severity']}): {gap['message']}"
    lines.insert(idx, todo)

    path.write_text("\n".join(lines))
