
# setup.ps1 — Woodpecker one-shot Windows setup
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Step($msg, $color = 'Cyan') { Write-Host "`n» $msg" -ForegroundColor $color }

# ---- 1. Node dependencies ---------------------------------------------------
Step "Installing Node dependencies"
if (-not (Test-Path "package.json")) {
    Write-Host "  ⚠ package.json not found — run this from the project root." -ForegroundColor Red
    exit 1
}
npm install --no-audit --no-fund

# ---- 2. Generate AUTH_SECRET if .env missing --------------------------------
if (-not (Test-Path .env)) {
    Step "Creating .env with random AUTH_SECRET"
    $secret = -join ((1..48) | ForEach-Object { [char]((48..57) + (65..90) + (97..122) | Get-Random) })
    @"
# Woodpecker configuration
# Fill in MONGO_URI and QWEN_API_KEY with your real credentials.

MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/
QWEN_API_KEY=sk-your-qwen-key
AUTH_SECRET=$secret
OLLAMA_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_OCR_MODEL=deepseek-ocr
QWEN_BASE=https://maas.qwencloudapi.com/compatible-mode/v1
QWEN_MODEL=qwen3.8-flash
"@ | Set-Content .env -Encoding UTF8
    Write-Host "  ✓ Created .env — edit it now with your real MONGO_URI and QWEN_API_KEY." -ForegroundColor Yellow
} else {
    Write-Host "  ✓ .env already exists, skipping."
}

if (-not (Test-Path web\.env.local)) {
    Step "Copying .env → web\.env.local"
    Copy-Item .env web\.env.local
}

# ---- 3. Ollama + models -----------------------------------------------------
Step "Checking Ollama"
$ollamaOk = $false
try { if (Get-Command ollama -ErrorAction Stop) { $ollamaOk = $true } } catch {}
if (-not $ollamaOk) {
    Write-Host "  Ollama not found. Install from https://ollama.com/download" -ForegroundColor Yellow
    Write-Host "  After installing, re-run this script to pull the models." -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Ollama found."
    foreach ($m in @("nomic-embed-text", "deepseek-ocr")) {
        Step "Pulling Ollama model: $m"
        try { ollama pull $m } catch { Write-Host "  ⚠ Failed to pull $m — you can run 'ollama pull $m' later." -ForegroundColor Yellow }
    }
}

# ---- 4. Folder hygiene ------------------------------------------------------
Step "Ensuring folders exist"
foreach ($d in @("documents", "output")) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}

# ---- 5. Done ----------------------------------------------------------------
Write-Host "`n✅ Woodpecker is ready." -ForegroundColor Green
Write-Host "   1. Edit .env with your MONGO_URI and QWEN_API_KEY" -ForegroundColor White
Write-Host "   2. Create the Atlas vector index (see README)" -ForegroundColor White
Write-Host "   3. Run:  npm run dev" -ForegroundColor White
Write-Host "   4. Open: http://localhost:3000" -ForegroundColor DarkGray
