param(
  [switch]$KillPorts,
  [int]$FrontendPort = 3002,
  [int]$ApiPort = 5000,
  [int]$AiPort = 5002,
  [int]$WhatsappPort = 5001
)

$ErrorActionPreference = "Stop"

function Stop-Port([int]$Port) {
  try {
    $pids = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
      if ($pid) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {
    # best effort
  }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Escape-SingleQuotes([string]$s) {
  return ($s -replace "'", "''")
}

if ($KillPorts) {
  Stop-Port $FrontendPort
  Stop-Port $ApiPort
  Stop-Port $AiPort
  Stop-Port $WhatsappPort
}

$python = Join-Path $root ".venv\\Scripts\\python.exe"
if (!(Test-Path $python)) {
  $python = "python"
}

function Start-ServiceWindow([string]$Title, [string]$WorkDir, [string]$Command) {
  $t = Escape-SingleQuotes $Title
  $wd = Escape-SingleQuotes $WorkDir
  $cmd = @"
`$Host.UI.RawUI.WindowTitle = '$t'
Set-Location -LiteralPath '$wd'
$Command
"@

  Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $cmd
  )
}

$aiDir = Join-Path $root "services\\ai"
$apiDir = Join-Path $root "services\\api"
$waDir = Join-Path $root "services\\whatsapp"
$feDir = Join-Path $root "agentdock-frontend"

Start-ServiceWindow "AgentDock - AI (5002)" $aiDir "& '$python' app.py"
Start-ServiceWindow "AgentDock - API (5000)" $apiDir "& '$python' app.py"
Start-ServiceWindow "AgentDock - WhatsApp (5001)" $waDir "& '$python' app.py"

$nodeDir = Join-Path $feDir "node"
$npmCmd = Join-Path $nodeDir "npm.cmd"
$nodeDirEsc = Escape-SingleQuotes $nodeDir
$npmCmdEsc = Escape-SingleQuotes $npmCmd

$frontendCmd = @"
`$env:PATH = '$nodeDirEsc;' + `$env:PATH
& '$npmCmdEsc' run dev -- --port $FrontendPort
"@

Start-ServiceWindow "AgentDock - Frontend ($FrontendPort)" $feDir $frontendCmd

Write-Host ""
Write-Host "Started:"
Write-Host "  Frontend: http://localhost:$FrontendPort"
Write-Host "  API:      http://localhost:$ApiPort"
Write-Host "  AI:       http://localhost:$AiPort"
Write-Host "  WhatsApp: http://localhost:$WhatsappPort"
Write-Host ""
Write-Host "Tip: Run with -KillPorts to free ports first:"
Write-Host "  .\\run-all.ps1 -KillPorts"
