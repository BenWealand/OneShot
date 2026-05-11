from pathlib import Path

from PIL import Image, ImageDraw

from ai.fitshelf_tryon import run_tryon


def test_run_tryon_creates_output(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setenv("FITSHELF_SKIP_ENV_FILE", "1")
    monkeypatch.delenv("FITSHELF_CATVTON_COMMAND", raising=False)

    person = tmp_path / "person.jpg"
    garment = tmp_path / "garment.jpg"
    out = tmp_path / "result.jpg"
    debug = tmp_path / "debug"

    person_image = Image.new("RGB", (480, 720), (236, 232, 224))
    draw = ImageDraw.Draw(person_image)
    draw.ellipse((190, 80, 290, 180), fill=(171, 128, 100))
    draw.rectangle((170, 190, 310, 520), fill=(210, 190, 170))
    person_image.save(person)

    garment_image = Image.new("RGB", (320, 260), (255, 255, 255))
    draw = ImageDraw.Draw(garment_image)
    draw.rounded_rectangle((40, 35, 280, 235), radius=18, fill=(74, 104, 141))
    garment_image.save(garment)

    result = run_tryon(person, garment, "upper", out, debug)

    assert result.output_path.exists()
    assert result.metadata_path.exists()
    assert (debug / "garment_mask.png").exists()
    assert Image.open(out).size == (1024, 1024)
