<#
.SYNOPSIS
  Merges the contents of specified file types into a single timestamped text file in your Downloads folder, 
  with each file preceded by a Markdown heading of its relative path.

.PARAMETER FileTypes
  An array of wildcard patterns to include. E.g. "*.css", "*.json", "*.ps1".

.EXAMPLE
  .\Merge-FileContents.ps1 -FileTypes "*.css","*.json"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string[]]$FileTypes
)

# 1. Establish paths
$startDir   = Get-Location
$timestamp  = Get-Date -Format "yyyyMMdd_HHmmss"
$downloads  = Join-Path $env:USERPROFILE "Downloads"
$outputFile = Join-Path $downloads "CombinedContents_$timestamp.txt"

# 2. (Re)create the output file
New-Item -Path $outputFile -ItemType File -Force | Out-Null

# 3. Gather files, skipping hidden/system

# Gather everything matching each wildcard via -Filter (fast & reliable)
$raw = foreach ($pat in $FileTypes) {
    Get-ChildItem `
      -Path $startDir `
      -Recurse `
      -File `
      -Filter $pat `
      -ErrorAction SilentlyContinue
}

# Now apply the “no-extension / no hidden / no system” rules
$files = $raw |
  Where-Object {
    $_.Extension -ne '' -and
    -not ($_.Attributes -band [IO.FileAttributes]::Hidden) -and
    -not ($_.Attributes -band [IO.FileAttributes]::System)
  }

# 4. Iterate and append
$intro = "The following are the files of a website. The files are separated by Markdown headings that include the file's relative directory path."
Add-Content -Path $outputFile -Value $intro -Encoding UTF8
Add-Content -Path $outputFile -Value "" -Encoding UTF8

foreach ($file in $files) {
    try {
        # Compute a POSIX-style relative path for the heading
        $rel = $file.FullName.Substring($startDir.Path.Length + 1).Replace('\','/')
        Add-Content -Path $outputFile -Value "# $rel" -Encoding UTF8
        
        # Read & append file content
        Get-Content -Path $file.FullName -Encoding UTF8 -ErrorAction Stop |
            Add-Content -Path $outputFile -Encoding UTF8

        # Blank line to separate entries
        Add-Content -Path $outputFile -Value "" -Encoding UTF8
    }
    catch {
        Write-Warning "Skipping unreadable file: $($file.FullName)"
    }
}

Write-Host "Done! Combined contents written to:`n$outputFile"
Invoke-Item $outputFile