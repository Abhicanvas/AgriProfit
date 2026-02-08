#!/usr/bin/env python3
"""
Generate secure secrets for production deployment.

Usage:
    python generate_secrets.py

Prints secrets to stdout - do not store in files checked into version control.
"""
import secrets
import sys

def generate_secrets():
    """Generate and print secure secrets."""
    print("=" * 60)
    print("PRODUCTION SECRETS - COPY THESE TO YOUR .env FILE")
    print("=" * 60)
    print()
    print(f"SECRET_KEY={secrets.token_urlsafe(64)}")
    print(f"JWT_SECRET={secrets.token_urlsafe(64)}")
    print(f"POSTGRES_PASSWORD={secrets.token_urlsafe(32)}")
    print()
    print("=" * 60)
    print("WARNING: Store these securely. Do not commit to version control.")
    print("=" * 60)

if __name__ == "__main__":
    generate_secrets()
