import sys
print(f"Python executable: {sys.executable}")
try:
    import fastapi
    print(f"FastAPI version: {fastapi.__version__}")
except ImportError:
    print("FastAPI not found")

try:
    import httpx
    print(f"HTTPX version: {httpx.__version__}")
except ImportError:
    print("HTTPX not found")
