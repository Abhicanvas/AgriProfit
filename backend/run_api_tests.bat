@echo off
chcp 65001 > nul
cd /d c:\Users\alame\Desktop\repo-root\backend
python scripts\test_all_endpoints.py
pause
