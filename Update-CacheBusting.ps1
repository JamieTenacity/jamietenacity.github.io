$files = @{
    "css/styles.css"     = '(css/styles\.css\?v=)(\d+)'
    "js/catalogue.js"    = '(js/catalogue\.js\?v=)(\d+)'
    "site.webmanifest"   = '(site\.webmanifest\?v=)(\d+)'
}

$htmlPath = "index.html"
$html = Get-Content $htmlPath -Raw

foreach ($file in $files.Keys) {
    if (Test-Path $file) {
        $dt = Get-Item $file | Select-Object -ExpandProperty LastWriteTimeUtc
        $mtime = $dt.ToFileTimeUtc()
        Write-Host "$file last modified: $mtime"
        $pattern = $files[$file]
        $html = [System.Text.RegularExpressions.Regex]::Replace(
            $html,
            $pattern,
            { param($m) "$($m.Groups[1].Value)$mtime" }
        )
    } else {
        Write-Host "File not found: $file"
    }
}

Set-Content $htmlPath $html
Write-Host "Cache-busting version numbers updated in index.html!"