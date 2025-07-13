#!/bin/bash

echo "=== Proxy Connection Test Script ==="
echo ""

# Test 1: Test if curl can reach google.com
echo "1. Testing curl connectivity to google.com..."
echo "----------------------------------------"
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://google.com | grep -q "200\|301\|302"; then
    echo "✓ SUCCESS: curl can reach google.com"
else
    echo "✗ FAILED: curl cannot reach google.com"
fi
echo ""

# Test 2: Test if wget can download from httpbin.org
echo "2. Testing wget download from httpbin.org..."
echo "----------------------------------------"
if wget -q --timeout=10 -O /tmp/httpbin-test.json https://httpbin.org/get 2>/dev/null; then
    echo "✓ SUCCESS: wget successfully downloaded from httpbin.org"
    rm -f /tmp/httpbin-test.json
else
    echo "✗ FAILED: wget cannot download from httpbin.org"
fi
echo ""

# Test 3: Test git clone using SSH
echo "3. Testing git SSH connectivity..."
echo "----------------------------------------"
# Test SSH connectivity to GitHub without actually cloning
if ssh -T -o ConnectTimeout=10 -o StrictHostKeyChecking=no git@github.com 2>&1 | grep -q "successfully authenticated\|Hi"; then
    echo "✓ SUCCESS: Git SSH connectivity to GitHub is working"
else
    echo "✗ FAILED: Cannot connect to GitHub via SSH"
    echo "Note: This might fail if SSH keys are not configured"
fi
echo ""

# Test 4: Show current proxy settings
echo "4. Current proxy settings:"
echo "----------------------------------------"
echo "Environment variables:"
echo "  HTTP_PROXY: ${HTTP_PROXY:-<not set>}"
echo "  HTTPS_PROXY: ${HTTPS_PROXY:-<not set>}"
echo "  http_proxy: ${http_proxy:-<not set>}"
echo "  https_proxy: ${https_proxy:-<not set>}"
echo "  NO_PROXY: ${NO_PROXY:-<not set>}"
echo "  no_proxy: ${no_proxy:-<not set>}"
echo ""

# Check git proxy settings
echo "Git proxy configuration:"
git_http_proxy=$(git config --global http.proxy 2>/dev/null || echo "<not set>")
git_https_proxy=$(git config --global https.proxy 2>/dev/null || echo "<not set>")
echo "  http.proxy: ${git_http_proxy}"
echo "  https.proxy: ${git_https_proxy}"
echo ""

# Check system proxy settings if available
if command -v gsettings &> /dev/null; then
    echo "System proxy settings (if available):"
    gsettings get org.gnome.system.proxy mode 2>/dev/null || echo "  System proxy: <not available>"
fi

echo ""
echo "=== Test completed ==="