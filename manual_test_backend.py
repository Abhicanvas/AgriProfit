import requests
import json
import sys

BASE_URL = "http://localhost:8000"
PHONE = "9876543212"
OTP = "123456"

def log(msg, status="INFO"):
    output = f"[{status}] {msg}\n"
    print(output, end="")
    try:
        with open("manual_test_output.txt", "a") as f:
            f.write(output)
    except:
        pass

def test_registration_flow():
    log("=== Test Script 1: Backend API Verification ===")

    # 1.2 Test Phone Number Validation
    log("Testing Phone Validation...")
    # 9 digits
    r = requests.post(f"{BASE_URL}/auth/request-otp", json={"phone_number": "123456789"})
    if r.status_code == 422: # Pydantic validation error or 400
        log("PASS: 9 digits rejected")
    else:
        log(f"FAIL: 9 digits accepted? Status: {r.status_code}", "ERROR")

    # 11 digits
    r = requests.post(f"{BASE_URL}/auth/request-otp", json={"phone_number": "12345678901"})
    if r.status_code == 422:
        log("PASS: 11 digits rejected")
    else:
        log(f"FAIL: 11 digits accepted? Status: {r.status_code}", "ERROR")
    
    # Letters
    r = requests.post(f"{BASE_URL}/auth/request-otp", json={"phone_number": "abcdefghij"})
    if r.status_code == 422:
        log("PASS: Letters rejected")
    else:
        log(f"FAIL: Letters accepted? Status: {r.status_code}", "ERROR")

    # Valid
    r = requests.post(f"{BASE_URL}/auth/request-otp", json={"phone_number": PHONE})
    if r.status_code == 200:
        log("PASS: Valid phone accepted")
    elif r.status_code == 429:
        log("WARN: Rate limited (expected if re-running)", "WARN")
    else:
        log(f"FAIL: Valid phone rejected. Status: {r.status_code}", "ERROR")
        log(r.text)
        return

    # 1.4 Test OTP Input
    log("Testing OTP Validation...")
    # Letters
    r = requests.post(f"{BASE_URL}/auth/verify-otp", json={"phone_number": PHONE, "otp": "abcdef"})
    if r.status_code == 422:
        log("PASS: Letters OTP rejected")
    else:
        log(f"FAIL: Letters OTP accepted? Status: {r.status_code}", "ERROR")

    # Valid Data
    verify_data = {"phone_number": PHONE, "otp": OTP}
    r = requests.post(f"{BASE_URL}/auth/verify-otp", json=verify_data)
    
    token = None
    if r.status_code == 200:
        data = r.json()
        token = data.get("access_token")
        log("PASS: OTP Verified")
    else:
        log(f"FAIL: OTP Verification failed. Status: {r.status_code}", "ERROR")
        log(r.text)
        return

    # 1.5 Complete Profile
    log("Testing Profile Completion...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Empty Name (Pydantic min_length=2)
    profile_data_inv = {"name": "", "age": 25, "state": "Kerala", "district": "Malappuram"}
    r = requests.post(f"{BASE_URL}/auth/complete-profile", json=profile_data_inv, headers=headers)
    if r.status_code == 422:
        log("PASS: Empty name rejected")
    else:
        log(f"FAIL: Empty name accepted? Status: {r.status_code}", "ERROR")

    # Valid Profile
    profile_data = {"name": "Test User", "age": 25, "state": "Kerala", "district": "Malappuram"}
    r = requests.post(f"{BASE_URL}/auth/complete-profile", json=profile_data, headers=headers)
    
    if r.status_code == 200 or r.status_code == 400: # 400 if already complete
        log("PASS: Profile completed (or already complete)")
    else:
        log(f"FAIL: Profile completion failed. Status: {r.status_code}", "ERROR")
        log(r.text)

    # 1.6 Verify Session
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if r.status_code == 200:
        user = r.json()
        if user["name"] == "Test User" and user["phone_number"] == PHONE:
            log("PASS: Session verified, user data match")
        else:
            log(f"FAIL: User data mismatch: {user}", "ERROR")
    else:
        log(f"FAIL: Verify session failed. Status: {r.status_code}", "ERROR")

if __name__ == "__main__":
    try:
        test_registration_flow()
    except Exception as e:
        log(f"EXCEPTION: {e}", "ERROR")
