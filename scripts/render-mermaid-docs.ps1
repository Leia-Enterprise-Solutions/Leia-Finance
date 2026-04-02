param(
  [string]$RepoRoot = (Resolve-Path ".").Path,
  [string]$DocsRoot = "docs",
  [string]$RenderedRoot = "docs/diagrams/_rendered/from_md",
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
  # Mermaid CLI parsing hardening:
  # - Parentheses inside node labels often trigger parse errors in mermaid-cli.
  # Keep semantics by removing the literal characters only.
  return $body.Replace("(", "").Replace(")", "")
}

Set-Location $RepoRoot

$docsPath = Join-Path $RepoRoot $DocsRoot
if (!(Test-Path -LiteralPath $docsPath)) {
  throw "DocsRoot not found: $docsPath"
}

$mdFiles = Get-ChildItem -LiteralPath $docsPath -Recurse -File -Filter "*.md" |
  Where-Object {
    Select-String -LiteralPath $_.FullName -Pattern "```mermaid" -Quiet
  }

if ($mdFiles.Count -eq 0) {
  Write-Output "No Mermaid blocks found."
  exit 0
}

$tmpDir = Join-Path $RepoRoot ".tmp/mermaid-md-render"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

foreach ($f in $mdFiles) {
  $rel = $f.FullName.Substring($docsPath.Length).TrimStart("\", "/")
  $slug = Slugify([IO.Path]::ChangeExtension($rel, $null))
  $artefactsDir = Join-Path $RepoRoot ($RenderedRoot.Replace("/", "\") + "\" + $slug)
  New-Item -ItemType Directory -Path $artefactsDir -Force | Out-Null

  $tmpOutMd = Join-Path $tmpDir ($slug + ".md")
  $tmpInMd = Join-Path $tmpDir ($slug + ".input.md")

  # Pre-sanitize Mermaid blocks for mermaid-cli parsing:
  # The CLI parser is strict and may choke on parentheses inside labels.
  $raw = Get-Content -LiteralPath $f.FullName -Raw
  $sanitized = [regex]::Replace(
    $raw,
    '(?s)```mermaid\s*(.*?)\s*```',
    {
      param($m)
      $body = $m.Groups[1].Value
      $body = SanitizeMermaid $body
      '```mermaid' + "`n" + $body + "`n" + '```'
    }
  )
  Set-Content -LiteralPath $tmpInMd -Value $sanitized -NoNewline

  try {
    # Render: extract all ```mermaid blocks into SVG artefacts + produce markdown with image links
    npx --yes $MermaidCli -i $tmpInMd -o $tmpOutMd -a $artefactsDir -e svg -b transparent -q | Out-Null
  } catch {
    Write-Warning ("Failed to render Mermaid for: " + $rel)
    throw
  }

  # Normalize path separators in markdown image links
  $content = Get-Content -LiteralPath $tmpOutMd -Raw
  $content = $content -replace "\\", "/"

  Set-Content -LiteralPath $f.FullName -Value $content -NoNewline

  Write-Output ("Rendered Mermaid -> SVG and updated markdown: " + $rel)
}

