#!/bin/bash

# FairWin DynamoDB Stack Deployment Script
# Usage: ./deploy.sh [stage|prod]

set -e

ENV=${1:-stage}

if [[ "$ENV" != "stage" && "$ENV" != "prod" ]]; then
    echo "Error: Environment must be 'stage' or 'prod'"
    echo "Usage: ./deploy.sh [stage|prod]"
    exit 1
fi

STACK_NAME="FairWin-${ENV}-DynamoDB"
TEMPLATE_FILE="${ENV}.yaml"
REGION=${AWS_REGION:-ap-south-1}

echo "=================================================="
echo "Deploying FairWin DynamoDB Stack"
echo "Environment: ${ENV}"
echo "Stack Name: ${STACK_NAME}"
echo "Region: ${REGION}"
echo "Template: ${TEMPLATE_FILE}"
echo "=================================================="

# Validate template
echo ""
echo "Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://${TEMPLATE_FILE} \
    --region ${REGION} > /dev/null

echo "✅ Template validation successful"

# Check if stack exists
if aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --region ${REGION} > /dev/null 2>&1; then

    echo ""
    echo "Stack exists. Updating..."
    aws cloudformation update-stack \
        --stack-name ${STACK_NAME} \
        --template-body file://${TEMPLATE_FILE} \
        --region ${REGION} \
        --capabilities CAPABILITY_IAM

    echo ""
    echo "Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete \
        --stack-name ${STACK_NAME} \
        --region ${REGION}

    echo "✅ Stack updated successfully"
else
    echo ""
    echo "Stack does not exist. Creating..."
    aws cloudformation create-stack \
        --stack-name ${STACK_NAME} \
        --template-body file://${TEMPLATE_FILE} \
        --region ${REGION} \
        --capabilities CAPABILITY_IAM

    echo ""
    echo "Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete \
        --stack-name ${STACK_NAME} \
        --region ${REGION}

    echo "✅ Stack created successfully"
fi

# Display outputs
echo ""
echo "=================================================="
echo "Stack Outputs:"
echo "=================================================="
aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --region ${REGION} \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Table Names:"
echo "  Shared Tables:"
echo "    - FairWin-${ENV}-Users"
echo "    - FairWin-${ENV}-PlatformStats"
echo "  Raffle Game Tables:"
echo "    - FairWin-${ENV}-Raffle-Raffles"
echo "    - FairWin-${ENV}-Raffle-Entries"
echo "    - FairWin-${ENV}-Raffle-Winners (includes payout info)"
echo ""
echo "Update your .env file with:"
echo "  DYNAMODB_TABLE_RAFFLES=FairWin-${ENV}-Raffle-Raffles"
echo "  DYNAMODB_TABLE_ENTRIES=FairWin-${ENV}-Raffle-Entries"
echo "  DYNAMODB_TABLE_USERS=FairWin-${ENV}-Users"
echo "  DYNAMODB_TABLE_WINNERS=FairWin-${ENV}-Raffle-Winners"
echo "  DYNAMODB_TABLE_PLATFORM_STATS=FairWin-${ENV}-PlatformStats"
echo ""
