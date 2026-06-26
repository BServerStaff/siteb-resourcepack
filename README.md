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
