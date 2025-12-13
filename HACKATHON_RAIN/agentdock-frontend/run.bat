@echo off
set PATH=%CD%\node;%PATH%
node\npm install --no-optional
node\npm run dev