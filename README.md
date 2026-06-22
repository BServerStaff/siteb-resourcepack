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

dinoCore sets each artifact's string custom-model-data component to:

```text
dinocore:artifact/<artifact_id>
```

The build reads the matching dinoCore item definition from:

```text
src/assets/dinocore/items/artifact/<artifact_id>.json
```

It then generates vanilla-material selectors in the built pack. Each selector
has a normal Minecraft model fallback, so declining the pack never produces a
missing texture.

## dinoCore shop category icons

The main shop GUI sets each category icon's string custom-model-data value to:

```text
dinocore:shop/category/<category_id>
```

The build generates vanilla item definitions that select the custom route only
when that value is present, then fall back to the normal vanilla model. This
means players without the resource pack still see the configured vanilla icon.

Shop item definitions and models live at:

```text
src/assets/dinocore/items/shop/category/<category_id>.json
src/assets/dinocore/models/shop/category/<category_id>.json
```

The included models use vanilla textures as defaults. To customize an icon,
add a PNG under `src/assets/dinocore/textures/item/shop/category/` and change
that model's `layer0` to `dinocore:item/shop/category/<category_id>`.

Recommended custom-art layout:

```text
src/assets/dinocore/items/artifact/head_bowl.json
src/assets/dinocore/models/artifact/head_bowl.json
src/assets/dinocore/textures/item/artifact/head_bowl/
```

The Vote Note is the reference implementation:

```text
src/assets/dinocore/items/artifact/vote_note.json
src/assets/dinocore/models/artifact/vote_note/
src/assets/dinocore/textures/item/artifact/vote_note/
```

Vanilla definitions under `assets/minecraft/items` remain useful for global
overrides. dinoCore artifacts use namespaced definitions under
`assets/dinocore/items/artifact` instead of matching custom names or lore.

### Plushies

Plushies carry:

```text
dinocore:artifact/plushie/<plushie_id>
```

The build derives each plushie's plugin ID from the model filename and routes
all plushies through the vanilla `popped_chorus_fruit` item selector. Models
and textures live at:

```text
src/assets/dinocore/models/artifact/plushie/
src/assets/dinocore/textures/item/artifact/plushie/
```

Plushies with a rarity appear in the shop. The baby dragon and three placement
trophies have no rarity and are command-only. The SiteB box model is used by
the separate `dinocore:artifact/random_plushie_box` loot-box artifact.

`user` and `dino` inherit the shared
`models/artifact/plushie/humanoid.json` geometry. Their child models only map
texture slots. User keeps animated left-arm textures, while Dino uses its
own animated left-arm sheets generated from the Dino skin. Both therefore use
the same geometry, display transforms, wave timing, and behavior; only their
textures differ.

### Placeholders and vanilla fallback

Unfinished artifacts, tag vouchers, and shop categories have item-definition
and model JSON placeholders in the `dinocore` namespace. Their models inherit
the matching vanilla model, so they remain visually vanilla until custom art
is added. Empty texture directories are provided beside the authored assets
as convenient destinations for future PNGs.

All tag vouchers use:

```text
dinocore:tag_voucher
```

Their flat GUI/ground artwork lives at:

```text
src/assets/dinocore/models/tag_voucher/tag_voucher_gui.json
src/assets/dinocore/textures/item/tag_voucher/tag_voucher_gui.png
```
