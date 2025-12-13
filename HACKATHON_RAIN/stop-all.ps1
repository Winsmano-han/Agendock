param(
  [int]$FrontendPort = 3002,
  [int]$ApiPort = 5000,
  [int]$AiPort = 5002,
  [int]$WhatsappPort = 5001
)

$ErrorActionPreference = "Stop"

function Stop-Port([int]$Port) {
  $pids = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($pid in $pids) {
    if ($pid) {
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
  }
}

Stop-Port $FrontendPort
Stop-Port $ApiPort
Stop-Port $AiPort
Stop-Port $WhatsappPort

Write-Host "Stopped processes on ports $FrontendPort, $ApiPort, $AiPort, $WhatsappPort."
