# SiteB Resource Pack

Resource pack for the SiteB Minecraft server.

## Build

```text
node build.js <srcDir> <outDir> <zipName>
```

Example:

```powershell
node build.js ".\src" ".\build" "SiteB.zip"
```

The build validates and minifies JSON, recreates the output directory, creates
the ZIP, and writes its SHA-1 to `sha1.txt`. On Windows it automatically uses
`C:\Program Files\7-Zip\7z.exe` when available; otherwise `7z` must be on PATH.

## dinoCore artifacts

dinoCore sets each artifact's `minecraft:item_model` component to:

```text
siteb:artifact/<artifact_id>
```

Item definitions therefore live at:

```text
src/assets/siteb/items/artifact/<artifact_id>.json
```

The pack defines every current artifact. Artifacts without custom artwork point
to their vanilla model until custom assets are added.

Recommended custom-art layout:

```text
src/assets/siteb/items/artifact/head_bowl.json
src/assets/siteb/models/item/artifact/head_bowl/head_bowl.json
src/assets/siteb/models/item/artifact/head_bowl/head_bowl_gui.json
src/assets/siteb/textures/item/artifact/head_bowl/head_bowl.png
src/assets/siteb/textures/item/artifact/head_bowl/head_bowl_gui.png
```

The Vote Note is the reference implementation:

```text
src/assets/siteb/items/artifact/vote_note.json
src/assets/siteb/models/item/artifact/vote_note/
src/assets/siteb/textures/item/artifact/vote_note/
```

Vanilla definitions under `assets/minecraft/items` remain useful for global or
legacy overrides. dinoCore artifacts should use namespaced definitions under
`assets/siteb/items/artifact` instead of matching custom names or lore.
