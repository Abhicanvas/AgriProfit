# Starting the Backend Server

## Quick Start

**Option 1: Using PowerShell Script (Recommended)**
```powershell
cd backend
.\start_backend.ps1
```

**Option 2: Direct Command**
```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Verify Backend is Running

The backend should be accessible at:
- `http://127.0.0.1:8000`
- `http://0.0.0.0:8000`

Check the API docs at:
- `http://127.0.0.1:8000/docs`

## Common Issues

### ModuleNotFoundError: No module named 'app'
**Solution:** Make sure you're running the command from the `backend` directory.

### Port Already in Use
**Solution:** Kill the existing process:
```powershell
Get-Process | Where-Object {$_.ProcessName -match "python|uvicorn"} | Stop-Process -Force
```

### Network Error from Frontend
**Solution:** 
1. Ensure backend is running on port 8000
2. Check `.env.local` in frontend has `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
3. The frontend admin page will show a red error banner if backend is unreachable

## Environment Variables

Create a `.env` file in the backend directory (copy from `.env.example`):
```bash
cp .env.example .env
```

## Production

For production, don't use `--reload` flag:
```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```
