#!/bin/bash
# Deploy frontend to S3 + CloudFront
# Assumes AWS CLI configured

set -e

BUCKET_NAME="your-frontend-bucket"
DISTRIBUTION_ID="your-cloudfront-distribution-id"

echo "Building frontend..."
cd frontend
npm run build

echo "Uploading to S3..."
aws s3 sync build/ s3://$BUCKET_NAME --delete

echo "Invalidating CloudFront..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "Frontend deployed successfully!"