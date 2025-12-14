#!/bin/bash

# API Testing Script for /api/analyze endpoint
# Usage: ./test-api.sh [base_url]
# Example: ./test-api.sh http://localhost:3000
# Example: ./test-api.sh https://your-app.vercel.app

BASE_URL="${1:-http://localhost:9000}"
ENDPOINT="${BASE_URL}/api/analyze"

echo "Testing API at: ${ENDPOINT}"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Valid Request
echo -e "${YELLOW}Test 1: Valid Request${NC}"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${ENDPOINT}?username=octocat&job_title=Senior%20Engineer&required_skills=JavaScript,React&seniority=senior&focus=fullstack")
http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Success (200)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Failed (${http_code})${NC}"
    echo "$body"
fi
echo ""

# Test 2: Invalid Username
echo -e "${YELLOW}Test 2: Invalid Username${NC}"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${ENDPOINT}?username=invalid@user&job_title=Engineer&required_skills=JS&seniority=mid&focus=frontend")
http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ Correctly rejected invalid username (400)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Unexpected response (${http_code})${NC}"
    echo "$body"
fi
echo ""

# Test 3: Missing Parameter
echo -e "${YELLOW}Test 3: Missing Required Parameter${NC}"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${ENDPOINT}?username=octocat&job_title=Engineer")
http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ Correctly rejected missing parameters (400)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Unexpected response (${http_code})${NC}"
    echo "$body"
fi
echo ""

# Test 4: Invalid Seniority
echo -e "${YELLOW}Test 4: Invalid Seniority Value${NC}"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${ENDPOINT}?username=octocat&job_title=Engineer&required_skills=JS&seniority=invalid&focus=frontend")
http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✓ Correctly rejected invalid seniority (400)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Unexpected response (${http_code})${NC}"
    echo "$body"
fi
echo ""

# Test 5: Rate Limiting (make 11 requests)
echo -e "${YELLOW}Test 5: Rate Limiting (11 requests)${NC}"
echo "Making 11 requests to test rate limiting..."
for i in {1..11}; do
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${ENDPOINT}?username=test${i}&job_title=Engineer&required_skills=JS&seniority=mid&focus=frontend")
    http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    
    if [ "$http_code" = "429" ]; then
        echo -e "${GREEN}✓ Request $i: Rate limited (429) - as expected${NC}"
        break
    elif [ "$http_code" = "200" ] || [ "$http_code" = "500" ]; then
        echo "Request $i: ${http_code}"
    fi
    sleep 0.5
done
echo ""

# Test 6: Check Rate Limit Headers
echo -e "${YELLOW}Test 6: Rate Limit Headers${NC}"
headers=$(curl -s -I "${ENDPOINT}?username=octocat&job_title=Engineer&required_skills=JS&seniority=mid&focus=frontend")
if echo "$headers" | grep -q "X-RateLimit"; then
    echo -e "${GREEN}✓ Rate limit headers present${NC}"
    echo "$headers" | grep "X-RateLimit"
else
    echo -e "${RED}✗ Rate limit headers missing${NC}"
fi
echo ""

echo "=================================="
echo "Testing complete!"

