

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CSS MODULE CONVERSION SCRIPT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Rename CSS files
Write-Host "STEP 1: Renaming CSS files to .module.css..." -ForegroundColor Yellow

# List of global files to NOT rename
$globalFiles = @("App.css", "index.css", "UserManagement.css")

# Count files
$cssCount = (Get-ChildItem -Path src -Recurse -Filter "*.css" | Where-Object { $_.Name -notin $globalFiles }).Count
Write-Host "Found $cssCount CSS files to convert" -ForegroundColor Gray

$renamedCount = 0
Get-ChildItem -Path src -Recurse -Filter "*.css" | ForEach-Object {
    $file = $_
    if ($globalFiles -contains $file.Name) {
        Write-Host "  Skipping global file: $($file.Name)" -ForegroundColor DarkGray
        return
    }
    
    $newName = $file.BaseName + ".module.css"
    $newPath = Join-Path $file.DirectoryName $newName
    
    # Check if module.css already exists
    if (Test-Path $newPath) {
        Write-Host "  WARNING: $newName already exists, skipping..." -ForegroundColor Yellow
        return
    }
    
    # Rename the file
    Rename-Item -Path $file.FullName -NewName $newName
    $renamedCount++
    Write-Host "  ✓ Renamed: $($file.Name) -> $newName" -ForegroundColor Green
}

Write-Host ""
Write-Host "Renamed $renamedCount files" -ForegroundColor Cyan
Write-Host ""

# Step 2: Update JSX imports
Write-Host "STEP 2: Updating JSX import statements..." -ForegroundColor Yellow

$jsxFiles = Get-ChildItem -Path src -Recurse -Filter "*.jsx"
$updatedFiles = 0

foreach ($file in $jsxFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Pattern 1: import './Component.css'
    $content = $content -replace "import\s+'\./([^']+)\.css'", "import styles from './`$1.module.css'"
    
    # Pattern 2: import "./Component.css"
    $content = $content -replace 'import\s+"\./([^"]+)\.css"', 'import styles from "./$1.module.css"'
    
    # Pattern 3: import 'Component.css'
    $content = $content -replace "import\s+'([^']+)\.css'", "import styles from '`$1.module.css'"
    
    # Pattern 4: import "./Component.css"
    $content = $content -replace 'import\s+"([^"]+)\.css"', 'import styles from "$1.module.css"'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        $updatedFiles++
        Write-Host "  ✓ Updated: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Updated $updatedFiles JSX files" -ForegroundColor Cyan
Write-Host ""

# Step 3: Show manual steps needed
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS (Manual):" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. For each component, update className usage:" -ForegroundColor White
Write-Host "   BEFORE: className='profile-card'" -ForegroundColor Gray
Write-Host "   AFTER:  className={styles.profileCard}" -ForegroundColor Gray
Write-Host ""
Write-Host "2. For multiple classes:" -ForegroundColor White
Write-Host "   className={`${styles.profileCard} ${styles.active}`}" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start with one component and test!" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan