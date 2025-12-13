@echo off
echo Downloading Node.js portable...
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-win-x64.zip' -OutFile 'node.zip'"
powershell -Command "Expand-Archive -Path 'node.zip' -DestinationPath '.'"
ren node-v20.10.0-win-x64 node
set PATH=%CD%\node;%PATH%
echo Node.js installed locally. Run: node\npm install