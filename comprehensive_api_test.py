import urllib.request
import urllib.parse
import json
import sys
import time

BASE_URL = "http://localhost:8000"
PHONE = "9876543212" # Reuse registered user
OTP = "123456"

# Global stash for IDs
commodity_id = None
mandi_id = None
post_id = None
token = None
admin_token = None

def log(msg, status="INFO"):
    print(f"[{status}] {msg}", flush=True)

def api_call(method, endpoint, data=None, headers=None):
    url = f"{BASE_URL}{endpoint}"
    if headers is None:
        headers = {}
    
    if data:
        json_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    else:
        json_data = None

    req = urllib.request.Request(url, data=json_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            content = response.read().decode("utf-8")
            try:
                json_content = json.loads(content)
            except:
                json_content = content
            return status_code, json_content
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        return e.code, content
    except Exception as e:
        return 500, str(e)

def login():
    global token
    log("--- Login Flow ---")
    status, verify_resp = api_call("POST", "/auth/verify-otp", {"phone_number": PHONE, "otp": OTP})
    
    if status == 200:
        token = verify_resp.get("access_token")
        log(f"Login Successful. Token: {token[:10]}...")
        return True
    else:
        log(f"Login Failed: {status} {verify_resp}", "ERROR")
        return False

def test_dashboard():
    log("--- Dashboard Flow ---")
    headers = {"Authorization": f"Bearer {token}"}
    
    status, _ = api_call("GET", "/analytics/dashboard", headers=headers)
    if status == 200:
        log("PASS: /analytics/dashboard")
    elif status == 404:
         log("WARN: /analytics/dashboard not found", "WARN")
    else:
         log(f"FAIL: /analytics/dashboard {status}", "ERROR")

    status, _ = api_call("GET", "/commodities/with-prices?sort_by=price&sort_order=desc&limit=5", headers=headers)
    if status == 200:
        log("PASS: /commodities/with-prices (Top 5)")
    else:
        log(f"FAIL: /commodities/with-prices {status}", "ERROR")

def test_commodities():
    global commodity_id
    log("--- Commodities Flow ---")
    headers = {"Authorization": f"Bearer {token}"}
    
    status, items = api_call("GET", "/commodities/", headers=headers)
    if status == 200:
        log(f"PASS: /commodities/ list ({len(items)} items)")
        if items and isinstance(items, list) and len(items) > 0:
            commodity_id = items[0].get('id')
    else:
        log(f"FAIL: /commodities/ {status}", "ERROR")

    status, _ = api_call("GET", "/commodities/search/?q=rice", headers=headers)
    if status == 200:
        log("PASS: /commodities/search/")
    else:
        log(f"FAIL: /commodities/search/ {status}", "ERROR")

def test_mandis():
    global mandi_id
    log("--- Mandis Flow ---")
    headers = {"Authorization": f"Bearer {token}"}
    
    status, items = api_call("GET", "/mandis/", headers=headers)
    if status == 200:
        log(f"PASS: /mandis/ list ({len(items)} items)")
        if items and isinstance(items, list) and len(items) > 0:
            mandi_id = items[0].get('id')
    else:
        log(f"FAIL: /mandis/ {status}", "ERROR")

def test_transport():
    log("--- Transport Flow ---")
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "commodity": "Rice",
        "quantity_kg": 1000,
        "distance_km": 50,
        "vehicle_type": "tempo"
    }
    status, _ = api_call("POST", "/api/v1/transport/calculate", data=payload, headers=headers)
    if status == 200:
        log("PASS: /transport/calculate")
    else:
        log(f"FAIL: /transport/calculate {status}", "ERROR")

def test_community():
    global post_id
    log("--- Community Flow ---")
    headers = {"Authorization": f"Bearer {token}"}
    
    post_data = {"title": "Test Post", "content": "Content", "post_type": "discussion"}
    status, resp = api_call("POST", "/community/posts/", data=post_data, headers=headers)
    
    if status in [200, 201]:
        post_id = resp.get("id")
        log("PASS: Create Post")
    else:
        # Retry with category
        post_data_2 = {"title": "Test 2", "content": "Content", "category": "General"}
        status, resp = api_call("POST", "/community/posts/", data=post_data_2, headers=headers)
        if status in [200, 201]:
            post_id = resp.get("id")
            log("PASS: Create Post (retry)")
        else:
            log(f"FAIL: Create Post {status}", "WARN")

    status, _ = api_call("GET", "/community/posts/", headers=headers)
    if status == 200:
        log("PASS: List Posts")
    else:
        log(f"FAIL: List Posts {status}", "ERROR")

if __name__ == "__main__":
    if login():
        test_dashboard()
        test_commodities()
        test_mandis()
        test_transport()
        test_community()
        log("Test Complete.")
    else:
        log("Authentication failed. Check if phone '9876543212' is registered via manual script previously.")
