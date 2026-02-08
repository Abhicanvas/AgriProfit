"""
API Flow Testing Script for AgriProfit
Tests critical user flows via API endpoints
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

class APITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.access_token = None
        self.refresh_token = None
        self.bugs = []
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        # Use ASCII-safe symbols for Windows console
        print(f"[{timestamp}] [{status}] {message}")
        
    def log_bug(self, bug_id, severity, flow, description, expected, actual):
        bug = {
            "id": bug_id,
            "severity": severity,
            "flow": flow,
            "description": description,
            "expected": expected,
            "actual": actual,
            "timestamp": datetime.now().isoformat()
        }
        self.bugs.append(bug)
        self.log(f"BUG #{bug_id}: {description}", "BUG")
        
    def test_auth_flow(self):
        """FLOW 1: Test authentication - OTP request and verify"""
        self.log("=" * 60)
        self.log("FLOW 1: Testing Authentication Flow")
        self.log("=" * 60)
        
        # Test 1.1: Request OTP with valid phone
        self.log("Test 1.1: Request OTP with valid phone number")
        try:
            response = requests.post(
                f"{self.base_url}/auth/request-otp",
                json={"phone_number": "9876543210"},
                headers={"Content-Type": "application/json"}
            )
            self.log(f"Status: {response.status_code}")
            data = response.json()
            self.log(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200:
                self.log("[PASS] OTP request successful", "PASS")
            else:
                self.log("[FAIL] OTP request failed", "FAIL")
                
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
            
        # Test 1.2: Request OTP with invalid phone (validation test)
        self.log("\nTest 1.2: Request OTP with invalid phone (validation)")
        try:
            response = requests.post(
                f"{self.base_url}/auth/request-otp",
                json={"phone_number": "123"},  # Too short
                headers={"Content-Type": "application/json"}
            )
            self.log(f"Status: {response.status_code}")
            data = response.json()
            self.log(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code in [400, 422]:
                self.log("[PASS] Validation error returned correctly", "PASS")
            else:
                self.log_bug(1, "Medium", "Auth", 
                           "Invalid phone should return 400/422", 
                           "400 or 422 status", 
                           f"Got {response.status_code}")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
            
        # Test 1.3: Verify OTP with test values
        self.log("\nTest 1.3: Verify OTP (using test OTP from dev mode)")
        for test_otp in ["123456", "000000", "111111"]:
            try:
                response = requests.post(
                    f"{self.base_url}/auth/verify-otp",
                    json={"phone_number": "9876543210", "otp": test_otp},
                    headers={"Content-Type": "application/json"}
                )
                data = response.json()
                
                if response.status_code == 200 and "access_token" in data:
                    self.access_token = data.get("access_token")
                    self.log(f"[PASS] OTP verified with: {test_otp}", "PASS")
                    self.log(f"Access token obtained: {self.access_token[:50]}...")
                    break
            except Exception as e:
                pass
                
        if not self.access_token:
            self.log("[INFO] Could not verify OTP with test values. Check backend logs for actual OTP.", "INFO")
                
    def test_user_profile(self):
        """Test user profile endpoints"""
        self.log("\n" + "=" * 60)
        self.log("Testing User Profile Endpoints")
        self.log("=" * 60)
        
        if not self.access_token:
            self.log("[SKIP] Skipping - no access token", "SKIP")
            return
            
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        # Get current user
        self.log("Test: GET /users/me")
        try:
            response = requests.get(f"{self.base_url}/users/me", headers=headers)
            self.log(f"Status: {response.status_code}")
            data = response.json()
            self.log(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status_code == 200:
                self.log("[PASS] User profile retrieved", "PASS")
            else:
                self.log("[FAIL] Failed to get user profile", "FAIL")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
            
    def test_commodities(self):
        """Test commodity listing"""
        self.log("\n" + "=" * 60)
        self.log("Testing Commodity Endpoints")
        self.log("=" * 60)
        
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        self.log("Test: GET /commodities")
        try:
            response = requests.get(f"{self.base_url}/commodities", headers=headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("data", data) if isinstance(data, dict) else data
                if isinstance(items, list):
                    self.log(f"[PASS] Retrieved {len(items)} commodities", "PASS")
                    if items:
                        self.log(f"Sample: {items[0].get('name', 'N/A')}")
                else:
                    self.log(f"[PASS] Commodities endpoint working", "PASS")
            else:
                self.log(f"[FAIL] Status {response.status_code}: {response.text[:200]}", "FAIL")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
            
    def test_health_endpoint(self):
        """Test health check endpoint"""
        self.log("\n" + "=" * 60)
        self.log("Testing Health Endpoint")
        self.log("=" * 60)
        
        self.log("Test: GET /health")
        try:
            response = requests.get(f"{self.base_url}/health")
            self.log(f"Status: {response.status_code}")
            if response.status_code == 200:
                self.log(f"Response: {response.json()}")
                self.log("[PASS] Health check passed", "PASS")
            else:
                self.log("[FAIL] Health check failed", "FAIL")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
                
    def test_transport_compare(self):
        """FLOW 3: Test transport comparison"""
        self.log("\n" + "=" * 60)
        self.log("FLOW 3: Testing Transport Cost Comparison")
        self.log("=" * 60)
        
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        # Test transport calculate
        self.log("Test: POST /transport/calculate")
        try:
            response = requests.post(
                f"{self.base_url}/transport/calculate",
                json={
                    "from_district_code": "KL-EKM",
                    "to_district_code": "KL-TVM",
                    "quantity": 50
                },
                headers=headers
            )
            self.log(f"Status: {response.status_code}")
            data = response.json()
            self.log(f"Response: {json.dumps(data, indent=2)[:500]}")
            
            if response.status_code == 200:
                self.log("[PASS] Transport calculation successful", "PASS")
            elif response.status_code == 401:
                self.log("[INFO] Requires authentication", "INFO")
            else:
                self.log("[FAIL] Transport calculation failed", "FAIL")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
            
    def test_community_posts(self):
        """FLOW 4: Test community posts"""
        self.log("\n" + "=" * 60)
        self.log("FLOW 4: Testing Community Posts")
        self.log("=" * 60)
        
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        # List posts
        self.log("Test: GET /posts")
        try:
            response = requests.get(f"{self.base_url}/posts", headers=headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                posts = data.get("data", data) if isinstance(data, dict) else data
                count = len(posts) if isinstance(posts, list) else "N/A"
                self.log(f"[PASS] Retrieved {count} posts", "PASS")
            elif response.status_code == 401:
                self.log("[INFO] Requires authentication", "INFO")
            else:
                self.log(f"[INFO] Status {response.status_code}", "INFO")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
            
    def test_inventory_endpoints(self):
        """FLOW 2: Test inventory endpoints"""
        self.log("\n" + "=" * 60)
        self.log("FLOW 2: Testing Inventory Endpoints")
        self.log("=" * 60)
        
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        # List inventory
        self.log("Test: GET /inventory")
        try:
            response = requests.get(f"{self.base_url}/inventory", headers=headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("data", data) if isinstance(data, dict) else data
                count = len(items) if isinstance(items, list) else "N/A"
                self.log(f"[PASS] Retrieved {count} inventory items", "PASS")
            elif response.status_code == 401:
                self.log("[INFO] Requires authentication", "INFO")
            else:
                self.log(f"[INFO] Status {response.status_code}", "INFO")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
            
    def test_forecasts(self):
        """FLOW 5: Test price forecasts"""
        self.log("\n" + "=" * 60)
        self.log("FLOW 5: Testing Price Forecasts")
        self.log("=" * 60)
        
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        self.log("Test: GET /forecasts")
        try:
            response = requests.get(
                f"{self.base_url}/forecasts",
                headers=headers
            )
            self.log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                self.log("[PASS] Forecast endpoint accessible", "PASS")
            elif response.status_code == 401:
                self.log("[INFO] Requires authentication", "INFO")
            else:
                self.log(f"[INFO] Status {response.status_code}", "INFO")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
            
    def test_admin_endpoints(self):
        """FLOW 6: Test admin endpoints (will fail without admin token)"""
        self.log("\n" + "=" * 60)
        self.log("FLOW 6: Testing Admin Endpoints")
        self.log("=" * 60)
        
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        self.log("Test: GET /admin/users")
        try:
            response = requests.get(f"{self.base_url}/admin/users", headers=headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                self.log("[PASS] Admin users endpoint accessible", "PASS")
            elif response.status_code == 403:
                self.log("[PASS] Correctly forbidden for non-admin", "PASS")
            elif response.status_code == 401:
                self.log("[INFO] Requires authentication", "INFO")
            else:
                self.log(f"[INFO] Status {response.status_code}", "INFO")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
    
    def test_mandis(self):
        """Test mandi endpoints"""
        self.log("\n" + "=" * 60)
        self.log("Testing Mandi Endpoints")
        self.log("=" * 60)
        
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        self.log("Test: GET /mandis")
        try:
            response = requests.get(f"{self.base_url}/mandis", headers=headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"[PASS] Mandis endpoint accessible", "PASS")
            elif response.status_code == 401:
                self.log("[INFO] Requires authentication", "INFO")
            else:
                self.log(f"[INFO] Status {response.status_code}", "INFO")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
            
    def test_prices(self):
        """Test prices endpoints"""
        self.log("\n" + "=" * 60)
        self.log("Testing Prices Endpoints")
        self.log("=" * 60)
        
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        self.log("Test: GET /prices")
        try:
            response = requests.get(f"{self.base_url}/prices", headers=headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                self.log("[PASS] Prices endpoint accessible", "PASS")
            elif response.status_code == 401:
                self.log("[INFO] Requires authentication", "INFO")
            else:
                self.log(f"[INFO] Status {response.status_code}", "INFO")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")

    def test_sales(self):
        """Test sales endpoints"""
        self.log("\n" + "=" * 60)
        self.log("Testing Sales Endpoints")
        self.log("=" * 60)
        
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        self.log("Test: GET /sales")
        try:
            response = requests.get(f"{self.base_url}/sales", headers=headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                self.log("[PASS] Sales endpoint accessible", "PASS")
            elif response.status_code == 401:
                self.log("[INFO] Requires authentication", "INFO")
            else:
                self.log(f"[INFO] Status {response.status_code}", "INFO")
        except Exception as e:
            self.log(f"[ERROR] Error: {str(e)}", "ERROR")
            
    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        
        if self.bugs:
            self.log(f"Total bugs found: {len(self.bugs)}", "WARNING")
            for bug in self.bugs:
                self.log(f"  BUG #{bug['id']} ({bug['severity']}): {bug['description']}")
        else:
            self.log("[PASS] No bugs found in API testing", "PASS")
            
        self.log("\nAuthentication status: " + ("Authenticated" if self.access_token else "Not authenticated"))
            
    def run_all_tests(self):
        """Run all API tests"""
        self.log("Starting API Flow Tests for AgriProfit")
        self.log(f"Base URL: {self.base_url}")
        self.log("=" * 60)
        
        self.test_health_endpoint()
        self.test_auth_flow()
        self.test_user_profile()
        self.test_commodities()
        self.test_mandis()
        self.test_prices()
        self.test_inventory_endpoints()
        self.test_sales()
        self.test_transport_compare()
        self.test_community_posts()
        self.test_forecasts()
        self.test_admin_endpoints()
        self.print_summary()
        

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
