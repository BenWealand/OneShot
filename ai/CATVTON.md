# CatVTON Integration

The official CatVTON source is vendored at `ai/vendor/CatVTON`.

License note: CatVTON is distributed under CC BY-NC-SA 4.0. Use this integration only for non-commercial work unless you obtain separate commercial rights.

## Environment

CatVTON documents a Python 3.9 conda environment and pins Torch 2.4-era dependencies. Keep it separate from the FitShelf app environment.

PowerShell setup when Python 3.9 is available:

```powershell
.\ai\scripts\setup_catvton.ps1 -Python python3.9
```

Or with any explicit Python 3.9 interpreter:

```powershell
.\ai\scripts\setup_catvton.ps1 -Python C:\Path\To\Python39\python.exe
```

On Windows, the setup script uses `ai/requirements-catvton-windows.txt`, which matches the official CatVTON pins except:

- `matplotlib==3.9.1.post1` because `matplotlib==3.9.1` has no binary wheel available in this environment.
- `diffusers==0.30.3` because the official `git+https://github.com/huggingface/diffusers.git` now resolves to a main branch requiring Python 3.10+, while CatVTON documents Python 3.9.
- `peft` is omitted for the base CatVTON runner because `peft>=0.17` conflicts with CatVTON's pinned `accelerate==0.31.0`; install PEFT separately only for CatVTON-FLUX work after reconciling that dependency set.

## Pipeline Hook

Set `FITSHELF_CATVTON_COMMAND` in `ai/backend/.env` to call the dedicated CatVTON runner:

```dotenv
FITSHELF_CATVTON_COMMAND=ai/.venv-catvton/Scripts/python.exe ai/scripts/run_catvton.py --person {person} --garment {garment} --category {category} --out {out}
```

Then run the existing FitShelf command:

```powershell
py ai/scripts/run_tryon.py --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/result.jpg
```

The FitShelf pipeline will use CatVTON when the command exits 0 and writes the output file. If CatVTON fails, it records the error in metadata and falls back to the local renderer. CatVTON receives the original EXIF-corrected input images; FitShelf still emits normalized debug images, but those are no longer passed into CatVTON inference.

## Useful Options

`ai/scripts/run_catvton.py` reads these optional environment variables:

- `CATVTON_REPO`
- `CATVTON_WIDTH`
- `CATVTON_HEIGHT`
- `CATVTON_STEPS`
- `CATVTON_GUIDANCE_SCALE`
- `CATVTON_SEED`
- `CATVTON_MIXED_PRECISION`
- `CATVTON_BASE_MODEL_PATH`
- `CATVTON_RESUME_PATH`
- `CATVTON_MODEL_DIR`
- `CATVTON_DEVICE`
- `CATVTON_ALLOW_TF32`

The runner downloads remote Hugging Face snapshots into `CATVTON_MODEL_DIR` with symlinks disabled, avoiding Windows Developer Mode or administrator requirements.

FitShelf category mapping:

- `upper` -> CatVTON `upper`
- `lower` -> CatVTON `lower`
- `dress` -> CatVTON `overall`

## Quality Notes

The 1-step smoke setting is only useful to prove the request path works. On this
Windows/CUDA setup it produces visually corrupted noise. Controlled outputs saved
under `ai/outputs/catvton-quality/` showed:

- `upper-384x512-1-fp16.jpg`: corrupted/noisy
- `upper-384x512-8-fp16.jpg`: coherent output
- `upper-384x512-8-no.jpg`: coherent output
- `upper-768x1024-8-no.jpg`: coherent higher-resolution output

Use `CATVTON_STEPS=20` or higher for current Preview/HD app checks. Keep `CATVTON_STEPS=50`,
`CATVTON_WIDTH=768`, `CATVTON_HEIGHT=1024`, and `CATVTON_MIXED_PRECISION=no` in
`ai/backend/.env` for quality-oriented backend runs.
