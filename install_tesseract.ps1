# install_tesseract.ps1
# Exécutez ce script APRÈS avoir téléchargé l'installeur Tesseract
# Usage: .\install_tesseract.ps1

$installer = "$env:USERPROFILE\Downloads\tesseract-ocr-w64-setup-5.5.0.20241111.exe"

if (-not (Test-Path $installer)) {
    Write-Host "ERREUR: Installeur introuvable a : $installer" -ForegroundColor Red
    Write-Host ""
    Write-Host "Telechargez Tesseract ici :" -ForegroundColor Yellow
    Write-Host "https://github.com/UB-Mannheim/tesseract/releases/download/v5.5.0.20241111/tesseract-ocr-w64-setup-5.5.0.20241111.exe"
    Write-Host ""
    Write-Host "Puis relancez ce script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Installation de Tesseract OCR en cours..." -ForegroundColor Cyan

# Installation silencieuse avec langue française incluse
Start-Process -FilePath $installer -ArgumentList "/S", "/COMPONENTS=langs\fra,langs\eng" -Wait -Verb RunAs

# Vérification
if (Test-Path "C:\Program Files\Tesseract-OCR\tesseract.exe") {
    Write-Host "Tesseract installe avec succes !" -ForegroundColor Green

    # Ajouter au PATH si pas encore fait
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    $tesseractPath = "C:\Program Files\Tesseract-OCR"
    if ($currentPath -notlike "*$tesseractPath*") {
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$tesseractPath", "Machine")
        Write-Host "Tesseract ajoute au PATH systeme." -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Redemarrez le serveur Django pour activer l OCR :" -ForegroundColor Yellow
    Write-Host "cd backend && .\\venv\\Scripts\\python.exe manage.py runserver"
} else {
    Write-Host "Installation echouee. Verifiez les droits administrateur." -ForegroundColor Red
}
