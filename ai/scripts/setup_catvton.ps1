param(
  [string]$Python = "python",
  [string]$Venv = "ai/.venv-catvton",
  [string]$Requirements = "ai/requirements-catvton-windows.txt"
)

$ErrorActionPreference = "Stop"

& $Python -m venv $Venv
$venvPython = Join-Path $Venv "Scripts/python.exe"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r $Requirements
& $venvPython ai/scripts/run_catvton.py --check --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/catvton-check.png

Write-Output "Set this before running FitShelf:"
Write-Output "`$env:FITSHELF_CATVTON_COMMAND='$venvPython ai/scripts/run_catvton.py --person {person} --garment {garment} --category {category} --out {out}'"
