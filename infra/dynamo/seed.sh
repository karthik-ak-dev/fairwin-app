#!/bin/bash

# FairWin DynamoDB Seed Data Script
# Initializes the PlatformStats table with default values
# Usage: ./seed.sh [stage|prod]

set -e

ENV=${1:-stage}

if [[ "$ENV" != "stage" && "$ENV" != "prod" ]]; then
    echo "Error: Environment must be 'stage' or 'prod'"
    echo "Usage: ./seed.sh [stage|prod]"
    exit 1
fi

REGION=${AWS_REGION:-ap-south-1}
PLATFORM_STATS_TABLE="FairWin-${ENV}-PlatformStats"

echo "=================================================="
echo "Seeding FairWin DynamoDB Tables"
echo "Environment: ${ENV}"
echo "Region: ${REGION}"
echo "=================================================="

# Seed PlatformStats table
echo ""
echo "Initializing PlatformStats table..."
aws dynamodb put-item \
    --table-name ${PLATFORM_STATS_TABLE} \
    --region ${REGION} \
    --item '{
        "statId": {"S": "global"},
        "totalRaffles": {"N": "0"},
        "totalEntries": {"N": "0"},
        "totalRevenue": {"N": "0"},
        "totalPaidOut": {"N": "0"},
        "totalWinners": {"N": "0"},
        "totalUsers": {"N": "0"},
        "createdAt": {"S": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"},
        "updatedAt": {"S": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"}'

echo "✅ PlatformStats initialized"

echo ""
echo "=================================================="
echo "Seed data created successfully!"
echo "=================================================="
echo ""
echo "Verify with:"
echo "  aws dynamodb get-item \\"
echo "    --table-name ${PLATFORM_STATS_TABLE} \\"
echo "    --key '{\"statId\": {\"S\": \"global\"}}' \\"
echo "    --region ${REGION}"
echo ""
