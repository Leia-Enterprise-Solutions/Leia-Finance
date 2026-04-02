param(
  [string]$RepoRoot = (Resolve-Path ".").Path,
  [string]$MmdRoot = "docs",
  [string]$RenderedRoot = "docs/diagrams/_rendered/from_mmd",
  [string]$MermaidCli = "@mermaid-js/mermaid-cli@latest"
)

$ErrorActionPreference = "Stop"

function Slugify([string]$s) {
  $s = $s -replace "[\\/:*?""<>|]", "-"
  $s = $s -replace "\s+", "-"
  $s = $s -replace "[^A-Za-z0-9._-]", "-"
  $s = $s -replace "-{2,}", "-"
  return $s.Trim("-")
}

function SanitizeMermaid([string]$body) {
  return $body.Replace("(", "").Replace(")", "")
}

Set-Location $RepoRoot

$rootPath = Join-Path $RepoRoot $MmdRoot
if (!(Test-Path -LiteralPath $rootPath)) {
  throw "MmdRoot not found: $rootPath"
}

$outRootPath = Join-Path $RepoRoot ($RenderedRoot.Replace("/", "\"))
New-Item -ItemType Directory -Path $outRootPath -Force | Out-Null

$tmpDir = Join-Path $RepoRoot ".tmp/mermaid-mmd-render"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

$mmdFiles = Get-ChildItem -LiteralPath $rootPath -Recurse -File -Filter "*.mmd"
if ($mmdFiles.Count -eq 0) {
  Write-Output "No .mmd files found."
  exit 0
}

$failed = @()

foreach ($f in $mmdFiles) {
  $rel = $f.FullName.Substring($rootPath.Length).TrimStart("\", "/")
  $slug = Slugify($rel)

  $tmpIn = Join-Path $tmpDir ($slug + ".sanitized.mmd")
  $outSvg = Join-Path $outRootPath ($slug.Replace("\", "__").Replace("/", "__") + ".svg")

  $raw = Get-Content -LiteralPath $f.FullName -Raw
  $sanitized = SanitizeMermaid $raw
  Set-Content -LiteralPath $tmpIn -Value $sanitized -NoNewline

  $output = & npx --yes $MermaidCli -i $tmpIn -o $outSvg -e svg -b transparent -q 2>&1
  if ($LASTEXITCODE -ne 0 -or ($output -match "Parse error")) {
    $failed += $rel
  } else {
    Write-Output ("Rendered .mmd -> SVG: " + $rel)
  }
}

if ($failed.Count -gt 0) {
  Write-Output "FAILED:"
  $failed | ForEach-Object { Write-Output $_ }
  exit 1
}

