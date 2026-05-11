# FitShelf AI Pipeline

Local milestone:

```bash
python ai/scripts/run_tryon.py --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/result.jpg
```

The current implementation exposes a stable `run_tryon()` interface and a deterministic local fallback renderer. If `FITSHELF_CATVTON_COMMAND` is set, the runner will call that command first with `{person}`, `{garment}`, `{category}`, and `{out}` placeholders. When no external model command is configured, it generates a visible proof image with preprocessing debug artifacts.

CatVTON integration lives in `ai/scripts/run_catvton.py`; setup notes are in `ai/CATVTON.md`.
Backend environment setup and startup commands are in `ai/backend/README.md`.

FastAPI backend run from `C:\Users\benwe\Projects\OneShot`:

```powershell
Copy-Item ai/backend/.env.example ai/backend/.env
.\ai\scripts\start_backend.ps1
```

Then submit a job:

```bash
py ai/scripts/client_tryon.py --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/api-result.jpg
```
