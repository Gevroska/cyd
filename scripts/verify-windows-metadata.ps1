param(
  [Parameter(Mandatory = $true)][string]$Path,
  [Parameter(Mandatory = $true)][string]$ExpectedVersion
)
$ErrorActionPreference = "Stop"
$metadata = [System.Diagnostics.FileVersionInfo]::GetVersionInfo((Resolve-Path -LiteralPath $Path).Path)
if ($metadata.ProductName -cne "Cyd") { throw "Unexpected ProductName: $($metadata.ProductName)" }
$expected = [version]($ExpectedVersion + ".0")
foreach ($actual in @($metadata.ProductVersion, $metadata.FileVersion)) {
  $normalized = ($actual -split '\+')[0]
  if (($normalized -split '\.').Count -eq 3) { $normalized += ".0" }
  if ([version]$normalized -ne $expected) { throw "Unexpected PE version: $actual (expected $ExpectedVersion)" }
}
Write-Host "Verified PE metadata: Cyd $ExpectedVersion at $Path"
