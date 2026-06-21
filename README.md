# SiteB Resource Pack
(updates for 26.2)

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

## dinoCore shop category icons

The main shop GUI sets each category icon's `minecraft:item_model` to:

```text
siteb:shop/category/<category_id>
```

Definitions and their GUI-only models live at:

```text
src/assets/siteb/items/shop/category/<category_id>.json
src/assets/siteb/models/item/gui/shop/category/<category_id>.json
```

The included models use vanilla textures as defaults. To customize an icon,
add a PNG under `textures/item/gui/shop/category/` and change that model's
`layer0` to `siteb:item/gui/shop/category/<category_id>`.

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

### Plushies

Plushies use:

```text
siteb:artifact/plushie/<plushie_id>
```

Their definitions are generated at:

```text
src/assets/siteb/items/artifact/plushie/<plushie_id>.json
```

The dinoCore repository contains `tools/sync-plushies.js`, which synchronizes
these definitions and `plushies.yml` from the model files in:

```text
src/assets/siteb/models/item/decoration/plushies/
```

Plushies with a rarity appear in the shop. The baby dragon and three placement
trophies have no rarity and are command-only. The SiteB box model is used by
the separate `siteb:artifact/random_plushie_box` loot-box artifact.
