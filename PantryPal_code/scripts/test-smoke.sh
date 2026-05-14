#!/bin/bash
# Smoke tests for PantryPal API

API_BASE="https://your-api-gateway-url.amazonaws.com/prod"

echo "Testing health check..."
curl -X GET "$API_BASE/health"

echo "Testing signup..."
curl -X POST "$API_BASE/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}'

echo "Testing login..."
curl -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}'

echo "Testing suggestMeals..."
curl -X POST "$API_BASE/suggestMeals" \
  -H "Content-Type: application/json" \
  -d '{"pantryItems":[{"name":"chicken","quantity":2,"unit":"lbs"}]}'

echo "Smoke tests completed."