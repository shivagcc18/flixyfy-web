$ErrorActionPreference = "Stop"
$Repo = "C:\Users\USER\Desktop\flixyfy-clean-stack-v2\repos\flixyfy-web"
$Runtime = "C:\Users\USER\Desktop\flixyfy-clean-stack-v2\runtime\local_launch_v1"
New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
Set-Content -LiteralPath (Join-Path $Runtime "frontend.pid") -Value $PID -Encoding ASCII
Set-Location $Repo
$env:NEXT_PUBLIC_FLIXYFY_API_URL = "http://127.0.0.1:8000"
& npm run dev -- --hostname 127.0.0.1 --port 3000
