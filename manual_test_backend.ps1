$ErrorActionPreference = "Stop"
$base = "http://localhost:8000"
$phone = "9876543212"
$otp = "123456"
$outFile = "test_results_manual.txt"

function Log {
    param($msg)
    Write-Host $msg
    $msg | Out-File -FilePath $outFile -Append -Encoding utf8
}

Log "Starting manual test..."

# 1. Request OTP
Log "Testing Request OTP..."
$body = @{ phone_number = $phone } | ConvertTo-Json
try {
    $res = Invoke-RestMethod -Uri "$base/auth/request-otp" -Method Post -Body $body -ContentType "application/json"
    Log "Request OTP Success: $($res | ConvertTo-Json -Depth 2)"
} catch {
    Log "Request OTP Failed: $_"
}

# 2. Verify OTP
Log "Testing Verify OTP..."
$verify_body = @{ phone_number = $phone; otp = $otp } | ConvertTo-Json
try {
    $token_res = Invoke-RestMethod -Uri "$base/auth/verify-otp" -Method Post -Body $verify_body -ContentType "application/json"
    Log "Verify OTP Success."
    $token = $token_res.access_token
} catch {
    Log "Verify OTP Failed: $_"
    exit
}

# 3. Complete Profile (might fail if already completed)
Log "Testing Complete Profile..."
$headers = @{ Authorization = "Bearer $token" }
$profile_body = @{ name = "Test User"; age = 25; state = "Kerala"; district = "Malappuram" } | ConvertTo-Json
try {
    $prof_res = Invoke-RestMethod -Uri "$base/auth/complete-profile" -Method Post -Body $profile_body -ContentType "application/json" -Headers $headers
    Log "Complete Profile Success: $($prof_res | ConvertTo-Json -Depth 2)"
} catch {
    Log "Complete Profile Warning/Error: $_"
}

# 4. Get User Profile
Log "Testing Get Profile..."
try {
    $me_res = Invoke-RestMethod -Uri "$base/auth/me" -Method Get -Headers $headers
    Log "Get Profile Success: $($me_res | ConvertTo-Json -Depth 2)"
} catch {
    Log "Get Profile Failed: $_"
}
