# FairWin DynamoDB Infrastructure

CloudFormation templates for deploying FairWin's DynamoDB tables across Stage and Production environments.

## Architecture Overview

FairWin uses a **hybrid table structure** that separates shared platform tables from game-specific tables:

- **Shared Tables**: Used across all games (Users, PlatformStats)
- **Game-Specific Tables**: Namespaced by game type (Raffle-*, Slots-*, etc.)

This design allows:
- ✅ Easy addition of new games without conflicts
- ✅ Shared user profiles across all games
- ✅ Centralized platform statistics
- ✅ Game-specific data isolation

## Tables Overview

### **Shared Tables (Cross-Game)**

#### 1. **Users Table**
- **Name**: `FairWin-{Env}-Users`
- **Primary Key**: `walletAddress` (HASH)
- **Purpose**: Stores user profiles and aggregate statistics across all games

#### 2. **PlatformStats Table**
- **Name**: `FairWin-{Env}-PlatformStats`
- **Primary Key**: `statId` (HASH)
- **Purpose**: Stores global platform statistics (single record with `statId='global'`)

### **Raffle Game Tables**

#### 3. **Raffle-Raffles Table**
- **Name**: `FairWin-{Env}-Raffle-Raffles`
- **Primary Key**: `raffleId` (HASH)
- **GSI1**: `status-endTime-index` - Query raffles by status, sorted by end time
- **GSI2**: `type-createdAt-index` - Query raffles by type (daily, weekly, etc.)
- **Purpose**: Stores all raffle configurations and metadata

#### 4. **Raffle-Entries Table**
- **Name**: `FairWin-{Env}-Raffle-Entries`
- **Primary Key**: `entryId` (HASH)
- **GSI1**: `raffleId-createdAt-index` - Get all entries for a raffle
- **GSI2**: `walletAddress-createdAt-index` - Get all entries for a user
- **Purpose**: Tracks user entries (ticket purchases) for raffles

#### 5. **Raffle-Winners Table**
- **Name**: `FairWin-{Env}-Raffle-Winners`
- **Primary Key**: `winnerId` (HASH)
- **GSI1**: `raffleId-createdAt-index` - Get all winners for a raffle
- **GSI2**: `walletAddress-createdAt-index` - Get all wins for a user
- **Purpose**: Tracks winning entries after VRF draw

#### 6. **Raffle-Payouts Table**
- **Name**: `FairWin-{Env}-Raffle-Payouts`
- **Primary Key**: `payoutId` (HASH)
- **GSI1**: `winnerId-createdAt-index` - Get payouts for a winner
- **GSI2**: `status-createdAt-index` - Query payouts by status (pending, paid, failed)
- **Purpose**: Tracks payout transactions to winners

## Future Games

When adding new games (e.g., Slots), follow this naming pattern:

```
Shared (Already Created):
  - FairWin-{Env}-Users
  - FairWin-{Env}-PlatformStats

Slots Game (New):
  - FairWin-{Env}-Slots-Games
  - FairWin-{Env}-Slots-Spins
  - FairWin-{Env}-Slots-Wins
  - FairWin-{Env}-Slots-Payouts (or reuse shared Payouts)
```

## Environment Differences

### Stage Environment
- No point-in-time recovery
- No encryption at rest
- No deletion protection
- Cost-optimized for development

### Production Environment
- ✅ Point-in-time recovery enabled (35-day retention)
- ✅ KMS encryption enabled
- ✅ Deletion policy: Retain
- ✅ Update replace policy: Retain
- ✅ Tagged as critical data
- Production-ready with full data protection

## Deployment

### Prerequisites
```bash
# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure
```

### Deploy Stage Environment
```bash
cd infra/dynamo
./deploy.sh stage
```

### Deploy Production Environment
```bash
cd infra/dynamo
./deploy.sh prod
```

### Initialize PlatformStats
```bash
# After deployment, seed the PlatformStats table
./seed.sh stage  # or prod
```

### Manual Deployment
```bash
# Stage
aws cloudformation create-stack \
  --stack-name FairWin-Stage-DynamoDB \
  --template-body file://stage.yaml \
  --region ap-south-1

# Production
aws cloudformation create-stack \
  --stack-name FairWin-Prod-DynamoDB \
  --template-body file://prod.yaml \
  --region ap-south-1
```

## Environment Variables

After deployment, update your `.env.local` file:

### Stage
```bash
# AWS
AWS_REGION=ap-south-1

# Shared Tables
DYNAMODB_TABLE_USERS=FairWin-Stage-Users
DYNAMODB_TABLE_PLATFORM_STATS=FairWin-Stage-PlatformStats

# Raffle Game Tables
DYNAMODB_TABLE_RAFFLES=FairWin-Stage-Raffle-Raffles
DYNAMODB_TABLE_ENTRIES=FairWin-Stage-Raffle-Entries
DYNAMODB_TABLE_WINNERS=FairWin-Stage-Raffle-Winners
DYNAMODB_TABLE_PAYOUTS=FairWin-Stage-Raffle-Payouts
```

### Production
```bash
# AWS
AWS_REGION=ap-south-1

# Shared Tables
DYNAMODB_TABLE_USERS=FairWin-Prod-Users
DYNAMODB_TABLE_PLATFORM_STATS=FairWin-Prod-PlatformStats

# Raffle Game Tables
DYNAMODB_TABLE_RAFFLES=FairWin-Prod-Raffle-Raffles
DYNAMODB_TABLE_ENTRIES=FairWin-Prod-Raffle-Entries
DYNAMODB_TABLE_WINNERS=FairWin-Prod-Raffle-Winners
DYNAMODB_TABLE_PAYOUTS=FairWin-Prod-Raffle-Payouts
```

## Stack Management

### View Stack Status
```bash
aws cloudformation describe-stacks \
  --stack-name FairWin-Stage-DynamoDB \
  --region ap-south-1
```

### View Table Details
```bash
aws dynamodb describe-table \
  --table-name FairWin-Stage-Raffle-Raffles \
  --region ap-south-1
```

### Delete Stack (Stage Only)
```bash
aws cloudformation delete-stack \
  --stack-name FairWin-Stage-DynamoDB \
  --region ap-south-1
```

**⚠️ Warning**: Production stacks have `DeletionPolicy: Retain`, so tables won't be deleted even if the stack is removed.

## Cost Estimation

**PAY_PER_REQUEST** billing mode:
- **Writes**: $1.25 per million write request units
- **Reads**: $0.25 per million read request units
- **Storage**: $0.25 per GB-month
- **Backup**: Additional cost for point-in-time recovery (prod only)

**Estimated Stage Cost**: ~$5-10/month (low traffic)
**Estimated Prod Cost**: ~$20-50/month (moderate traffic)

## Indexes and Query Patterns

### Common Queries

**Get active raffles:**
```typescript
// Uses: status-endTime-index
QueryCommand({
  TableName: 'FairWin-Stage-Raffle-Raffles',
  IndexName: 'status-endTime-index',
  KeyConditionExpression: '#status = :active',
  ExpressionAttributeValues: { ':active': 'active' }
})
```

**Get user entries:**
```typescript
// Uses: walletAddress-createdAt-index
QueryCommand({
  TableName: 'FairWin-Stage-Raffle-Entries',
  IndexName: 'walletAddress-createdAt-index',
  KeyConditionExpression: '#wallet = :address',
  ExpressionAttributeValues: { ':address': '0x...' }
})
```

**Get raffle winners:**
```typescript
// Uses: raffleId-createdAt-index
QueryCommand({
  TableName: 'FairWin-Stage-Raffle-Winners',
  IndexName: 'raffleId-createdAt-index',
  KeyConditionExpression: '#raffleId = :id',
  ExpressionAttributeValues: { ':id': 'raffle-123' }
})
```

**Get pending payouts:**
```typescript
// Uses: status-createdAt-index
QueryCommand({
  TableName: 'FairWin-Stage-Raffle-Payouts',
  IndexName: 'status-createdAt-index',
  KeyConditionExpression: '#status = :pending',
  ExpressionAttributeValues: { ':pending': 'pending' }
})
```

## Monitoring

### CloudWatch Metrics
- Read/Write capacity consumption
- Throttled requests
- User errors
- System errors

### Alarms (Production)
Consider setting up CloudWatch alarms for:
- High throttled request rate
- Elevated error rates
- Unexpected capacity consumption

## Backup & Recovery

### Production
- **Point-in-time recovery**: Enabled (35-day retention)
- **On-demand backups**: Manual via AWS Console/CLI

### Stage
- No automated backups
- Manual backups recommended before major changes

## Security

### Encryption
- **Stage**: Default encryption
- **Production**: KMS encryption enabled

### IAM Permissions Required
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/FairWin-*",
        "arn:aws:dynamodb:*:*:table/FairWin-*/index/*"
      ]
    }
  ]
}
```

## Troubleshooting

### Stack Update Failed
```bash
# View stack events
aws cloudformation describe-stack-events \
  --stack-name FairWin-Stage-DynamoDB \
  --region ap-south-1 \
  --max-items 10
```

### Table Not Found
- Ensure deployment completed successfully
- Verify table name in environment variables
- Check AWS region matches configuration

### Access Denied
- Verify IAM credentials have DynamoDB permissions
- Check resource ARNs in IAM policies

## Next Steps

After deploying tables:
1. ✅ Update environment variables in `.env.local`
2. ✅ Run seed script to initialize PlatformStats
3. Test API routes with local development
4. Set up CloudWatch alarms (production)
5. Configure backup schedules (production)

## Adding New Games

To add a new game (e.g., Slots):

1. Create new CloudFormation resources in `stage.yaml` and `prod.yaml`:
```yaml
  SlotsGamesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'FairWin-${Environment}-Slots-Games'
      # ... configure as needed
```

2. Update `lib/db/client.ts`:
```typescript
export const TABLE = {
  // Existing tables...
  SLOTS_GAMES: process.env.DYNAMODB_TABLE_SLOTS_GAMES || 'FairWin-Stage-Slots-Games',
}
```

3. Add new repositories in `lib/db/repositories/`
4. Deploy updated stack with `./deploy.sh stage`
