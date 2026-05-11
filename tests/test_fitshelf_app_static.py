import json
import math
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_avatar_panel_glb_gestures_and_numeric_inputs_contract() -> None:
    source = (ROOT / "fitshelf-app/src/components/AvatarPanel.tsx").read_text(encoding="utf-8")

    assert "useGLTF" in source
    assert "default-mannequin.glb" in source
    assert "const defaultAvatarModel = defaultAvatarAsset as unknown as string" in source
    assert "useGLTF(defaultAvatarModel)" in source
    assert "useGLTF(modelUri)" not in source
    assert "PanGestureHandler" in source
    assert "PinchGestureHandler" in source
    assert "CapsuleGeometry" not in source
    assert "This GLB has no rigged body morphs" in source
    assert "Avatar profile was not saved to Supabase. Local profile kept." in source
    assert "shortError" in source
    assert "setModelError(shortError" in source
    assert "viewerBannerDetail" in source
    assert "function avatarStatusLabel" in source
    assert "Saved | ${modelLabel}" in source
    assert "avatarStatusLabel(modelStatus, saved)" in source
    assert "function finiteVector" in source
    assert "function largestFiniteDimension" in source
    assert "GLB model has invalid finite bounds." in source
    assert "GLB model scale could not be computed." in source

    for key in ["height", "weight", "chest", "waist", "hips", "inseam", "shoulderWidth"]:
        assert f'key: "{key}"' in source
    assert "TextInput" in source
    assert "Slider" in source
    assert "keyboardType=\"numeric\"" in source
    assert "updateFieldText(field.key, value)" in source
    assert "flexWrap: \"wrap\"" in source
    assert "flexBasis: \"48%\"" in source


def test_default_avatar_asset_is_real_glb() -> None:
    asset = ROOT / "fitshelf-app/assets/avatar/default-mannequin.glb"
    data = asset.read_bytes()

    assert data[:4] == b"glTF"
    assert len(data) > 100_000
    _, version, total_length = struct.unpack_from("<4sII", data, 0)
    assert version == 2
    assert total_length == len(data)

    offset = 12
    json_chunk = None
    while offset < len(data):
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_length]
        offset += chunk_length
        if chunk_type == 0x4E4F534A:
            json_chunk = chunk

    assert json_chunk is not None
    gltf = json.loads(json_chunk.rstrip(b" \t\r\n\0").decode("utf-8"))
    position_accessors = [
        gltf["accessors"][primitive["attributes"]["POSITION"]]
        for mesh in gltf["meshes"]
        for primitive in mesh["primitives"]
        if "POSITION" in primitive.get("attributes", {})
    ]
    assert len(position_accessors) >= 10
    for accessor in position_accessors:
        for value in accessor.get("min", []) + accessor.get("max", []):
            assert math.isfinite(value)


def test_expo_avatar_glb_runtime_configuration_contract() -> None:
    package_json = json.loads((ROOT / "fitshelf-app/package.json").read_text(encoding="utf-8"))
    metro = (ROOT / "fitshelf-app/metro.config.js").read_text(encoding="utf-8")
    app_json = json.loads((ROOT / "fitshelf-app/app.json").read_text(encoding="utf-8"))

    for dependency in ["@react-three/fiber", "@react-three/drei", "expo-gl", "expo-asset", "three"]:
        assert dependency in package_json["dependencies"]
    assert '"glb"' in metro
    assert '"gltf"' in metro
    assert '"mjs"' in metro
    assert "expo-asset" in app_json["expo"]["plugins"]


def test_tryon_panel_persistence_and_result_image_contract() -> None:
    source = (ROOT / "fitshelf-app/src/components/TryOnPanel.tsx").read_text(encoding="utf-8")

    for label in ["Save Person", "Save Garment", "Save Look"]:
        assert label in source
    for label in ["Test Backend Schema", "Test Backend DB"]:
        assert label in source

    assert "schemaReady === \"fail\"" in source
    assert "Cloud saves are blocked" in source
    assert "priority_tables_ok" in source
    assert "ai/supabase/stabilization_patch.sql" in source

    assert "resultStoragePath" in source
    assert "supabase_storage_path" in source
    assert "Look was not saved to Supabase. Local copy kept." in source
    assert "saveSavedLooksLocally(next)" in source
    assert "Look was not saved to Supabase or local storage." in source
    assert "Rename was not saved to Supabase. Local name kept." in source
    assert "Delete was not saved to Supabase. Local list kept." in source
    assert "refreshSupabaseSignedUrl" in source
    assert "withProxyUrl" in source
    assert "Saved look opened with backend proxy fallback." in source
    assert "Saved look opened with local fallback." in source
    assert "Saved look refresh failed." in source
    assert "supabase_proxy_url: proxy" in source
    assert "function savedLookThumbnailUrl" in source
    assert "look.resultStoragePath" in source
    assert "savedLookThumbnailUrl(look)" in source
    assert "Saved Look thumbnail failed for ${look.name}. Open the look to refresh the result image." in source
    assert "/supabase/object?storage_path=" in source
    assert "local_result_url" in source
    assert "cacheBust(displayUrl, imageKey)" in source
    assert "onError={() => void handleResultImageError()}" in source


def test_manual_outfit_builder_is_separate_from_supabase_saved_looks() -> None:
    app = (ROOT / "fitshelf-app/App.tsx").read_text(encoding="utf-8")
    saved_outfits = (ROOT / "fitshelf-app/src/components/SavedOutfits.tsx").read_text(encoding="utf-8")
    tryon = (ROOT / "fitshelf-app/src/components/TryOnPanel.tsx").read_text(encoding="utf-8")

    assert 'const sections = ["try-on", "avatar", "closet", "manual"] as const' in app
    assert '"outfits"' not in app[app.index("const sections") : app.index("type Section")]
    assert "Manual builder drafts stay on this device" in app
    assert "Use Try-On Saved Looks for Supabase-backed generated results" in app
    assert "Manual Drafts" in saved_outfits
    assert "Saved manual drafts will appear here." in saved_outfits
    assert "Saved Looks" in tryon


def test_product_url_import_is_not_exposed_during_stabilization() -> None:
    app = (ROOT / "fitshelf-app/App.tsx").read_text(encoding="utf-8")
    library = (ROOT / "fitshelf-app/src/components/LibraryPanel.tsx").read_text(encoding="utf-8")

    assert "fetchProductImages" not in app
    assert "importProduct" not in app
    assert "onImportProduct" not in app + library
    assert "Product URL" not in library
    assert "Add garments to build your wardrobe." in library


def test_save_person_and_garment_supabase_success_requires_storage_path() -> None:
    app = (ROOT / "fitshelf-app/App.tsx").read_text(encoding="utf-8")

    for function_name, success_text, local_text in [
        ("addMannequin", "Person image saved to Supabase.", "Person image saved locally only."),
        ("addClothing", "Garment saved to Supabase.", "Garment saved locally only."),
    ]:
        start = app.index(f"async function {function_name}")
        next_function = app.find("async function", start + 1)
        body = app[start : next_function if next_function != -1 else len(app)]
        assert "uploaded.storagePath" in body
        assert success_text in body
        assert local_text in body
        assert f'? "{success_text}"' in body

    assert "Person image was not saved to Supabase. Local copy kept." in app
    assert "Garment was not saved to Supabase. Local copy kept." in app
    assert "Person image update was not saved to Supabase. Local edit kept." in app
    assert "Person image delete was not saved to Supabase. Item restored locally." in app
    assert "Wardrobe item update was not saved to Supabase. Local edit kept." in app
    assert "Wardrobe item delete was not saved to Supabase. Item restored locally." in app
    assert "local fallback active" not in app


def test_supabase_asset_upload_uses_arraybuffer_for_react_native() -> None:
    storage = (ROOT / "fitshelf-app/src/lib/storage.ts").read_text(encoding="utf-8")
    supabase = (ROOT / "fitshelf-app/src/lib/supabase.ts").read_text(encoding="utf-8")

    assert 'expo-file-system/legacy' in storage
    assert "readAsStringAsync" in storage
    assert "EncodingType.Base64" in storage
    assert "base64ToArrayBuffer" in storage
    assert "response.arrayBuffer()" in storage
    assert "upload(path, uploadBody.body" in storage
    assert 'extension === "jpg"' in storage
    assert 'extension === "jpeg"' in storage
    assert 'extension === "png"' in storage
    assert 'extension === "webp"' in storage
    assert 'return "jpg"' in storage
    assert ".blob()" not in storage
    assert "textToArrayBuffer" in supabase
    assert "new Blob" not in supabase


def test_tryon_form_upload_uses_guarded_image_metadata() -> None:
    tryon_api = (ROOT / "fitshelf-app/src/lib/tryonApi.ts").read_text(encoding="utf-8")

    assert "function extensionFor" in tryon_api
    assert "function contentTypeFor" in tryon_api
    for extension in ["jpg", "jpeg", "png", "webp"]:
        assert f'extension === "{extension}"' in tryon_api
    assert 'return "jpg"' in tryon_api
    assert "const extension = extensionFor(uri)" in tryon_api
    assert "type: contentTypeFor(extension)" in tryon_api


def test_app_supabase_persistence_auth_and_debug_contract() -> None:
    app = (ROOT / "fitshelf-app/App.tsx").read_text(encoding="utf-8")
    auth = (ROOT / "fitshelf-app/src/components/AuthPanel.tsx").read_text(encoding="utf-8")
    storage = (ROOT / "fitshelf-app/src/lib/storage.ts").read_text(encoding="utf-8")
    supabase = (ROOT / "fitshelf-app/src/lib/supabase.ts").read_text(encoding="utf-8")

    for label in ["Test Supabase", "Test DB Write", "Test Asset Upload"]:
        assert label in app
    assert "handleSupabaseAuthCallback(url)" in app
    assert "Linking.getInitialURL()" in app
    assert 'Linking.addEventListener("url"' in app
    assert "Auth changed, but profile creation failed." in app
    assert "setSession({ id: profile.userId, email: profile.email ?? nextSession.user.email ?? \"supabase-user\", mode: \"supabase\" })" in app
    assert "Session restored, but profile creation failed." in app
    assert "setSession({ id: profile.userId, email: profile.email ?? user.email, mode: \"supabase\" })" in app
    assert "Auth callback restored session, but profile creation failed." in app
    assert "setSession({ id: profile.userId, email: profile.email ?? \"supabase-user\", mode: \"supabase\" })" in app
    assert "Restore callback" in auth
    assert "Check session" in auth
    assert "checkExistingSession" in auth
    assert "supabase.auth.getSession()" in auth
    assert "No app session found. Paste the full verification callback URL if email did not reopen FitShelf." in auth
    assert "setBusy(false);\n    if (profile.error || !profile.userId)" in auth
    assert "Signed in, but profile creation failed." in auth
    assert "onSession({ id: profile.userId, email: profile.email ?? user.email, mode: \"supabase\" })" in auth
    assert "Paste verification callback URL" in auth
    assert "handleSupabaseAuthCallback(url)" in auth
    assert "if (!result.ok) {\n      setBusy(false);\n      return;\n    }" in auth

    readme = (ROOT / "fitshelf-app/README.md").read_text(encoding="utf-8")
    assert "tap `Check session` first" in readme
    assert "onSavePerson={(uri) => addMannequin(uri)}" in app
    assert "onSaveGarment={(uri, garmentCategory) => addClothing(uri, garmentCategory)}" in app

    for table in ["person_images", "wardrobe_items", "tryon_jobs", "saved_looks", "avatar_profiles"]:
        assert f'from("{table}")' in storage or f'from("{table}")' in supabase
    assert "user_id: userId" in storage
    assert "user_id: profile.userId" in supabase
    assert "throw new Error(dbMessage" in storage
    assert "Run ${stabilizationPatchFile}" in storage
    assert "Run ${stabilizationPatchFile}" in supabase

    expo_sources = app + auth + storage + supabase
    assert "SUPABASE_SERVICE_ROLE_KEY" not in expo_sources
    assert "SERVICE_ROLE" not in expo_sources


def test_storage_reload_queries_are_user_scoped() -> None:
    storage = (ROOT / "fitshelf-app/src/lib/storage.ts").read_text(encoding="utf-8")

    for table in ["person_images", "wardrobe_items", "saved_looks"]:
        start = storage.index(f'from("{table}")')
        query = storage[start : start + 180]
        assert '.eq("user_id",' in query


def test_storage_reload_uses_public_urls_for_storage_path_fallbacks() -> None:
    storage = (ROOT / "fitshelf-app/src/lib/storage.ts").read_text(encoding="utf-8")

    assert "function publicAssetUrl" in storage
    assert "function mergeLocalFallbacks" in storage
    assert f".from(assetBucket).getPublicUrl(storagePath)" in storage
    assert "row.image_url ?? publicAssetUrl(row.storage_path) ?? row.storage_path" in storage
    assert storage.count("return mergeLocalFallbacks(remote, local)") >= 3
    assert "function isLocalNewer" in storage
    assert "return isLocalNewer(fallback.updatedAt, remote.updatedAt) ? fallback : remote" in storage


def test_app_db_write_probe_reads_and_deletes_are_user_scoped() -> None:
    supabase = (ROOT / "fitshelf-app/src/lib/supabase.ts").read_text(encoding="utf-8")

    for table in ["person_images", "wardrobe_items", "tryon_jobs", "saved_looks"]:
        assert f'from("{table}")' in supabase

    assert supabase.count('.eq("user_id", profile.userId)') >= 13


def test_production_supabase_save_payloads_include_user_id() -> None:
    storage = (ROOT / "fitshelf-app/src/lib/storage.ts").read_text(encoding="utf-8")

    for function_name in ["saveMannequins", "saveClothing", "saveSavedLooks", "saveTryOnJobRecord"]:
        start = storage.index(f"export async function {function_name}")
        next_function = storage.find("export async function", start + 1)
        body = storage[start : next_function if next_function != -1 else len(storage)]
        assert "user_id: userId" in body

    start = storage.index("export async function saveAvatarMeasurements")
    body = storage[start:]
    assert "user_id: userId" in body


def test_saved_look_persistence_writes_durable_result_fields() -> None:
    storage = (ROOT / "fitshelf-app/src/lib/storage.ts").read_text(encoding="utf-8")

    start = storage.index("export async function saveSavedLooks")
    end = storage.index("export async function deleteSavedLook", start)
    body = storage[start:end]

    for field in ["tryon_job_id", "result_storage_path", "local_result_url", "result_url"]:
        assert field in body
    assert "resultStoragePath" in body
    assert "localResultUrl" in body
    assert "export async function saveSavedLooksLocally" in storage
    assert "writeJson(keys.savedLooks, items)" in storage


def test_saved_look_delete_writes_local_after_supabase_delete() -> None:
    storage = (ROOT / "fitshelf-app/src/lib/storage.ts").read_text(encoding="utf-8")

    start = storage.index("export async function deleteSavedLook")
    end = storage.index("export async function saveTryOnJobRecord", start)
    body = storage[start:end]

    assert body.index('from("saved_looks").delete()') < body.index("writeJson(keys.savedLooks, next)")
    assert "if (error) throw new Error(dbMessage(\"saved_looks delete\", error.message));" in body


def test_person_and_wardrobe_delete_write_local_after_supabase_delete() -> None:
    storage = (ROOT / "fitshelf-app/src/lib/storage.ts").read_text(encoding="utf-8")

    for function_name, table, key in [
        ("deleteMannequinRecord", "person_images", "mannequins"),
        ("deleteClothingRecord", "wardrobe_items", "clothing"),
    ]:
        start = storage.index(f"export async function {function_name}")
        end = storage.index("export async function", start + 1)
        body = storage[start:end]
        assert "const target = current.find((item) => item.id === id)" in body
        assert "if (!supabase || !target?.storagePath)" in body
        assert body.index(f'from("{table}").delete()') < body.index(f"writeJson(keys.{key}, next)")


def test_supabase_stabilization_patch_contract() -> None:
    patch = (ROOT / "ai/supabase/stabilization_patch.sql").read_text(encoding="utf-8").lower()

    for table in ["person_images", "wardrobe_items", "saved_looks"]:
        assert f"alter table {table}" in patch
    for column in [
        "label",
        "image_url",
        "color",
        "favorite",
        "result_storage_path",
        "local_result_url",
        "tryon_job_id",
    ]:
        assert column in patch

    assert "fitshelf-assets" in patch
    assert "tryon-results" in patch
    assert "storage.objects" in patch
    assert "fitshelf assets own objects" in patch
    assert "auth.uid()::text" in patch
    assert "notify pgrst, 'reload schema'" in patch
