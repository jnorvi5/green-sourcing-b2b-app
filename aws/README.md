# AWS Infrastructure Setup

This directory contains AWS CloudFormation templates for GreenChainz infrastructure.

## S3 Public Bucket Setup

### Prerequisites

- AWS CLI installed and configured
- AWS account with appropriate permissions to create S3 buckets and IAM users

### Deploy the S3 Bucket

```bash
# Deploy the CloudFormation stack
aws cloudformation create-stack \
  --stack-name greenchainz-s3-bucket \
  --template-body file://s3-public-bucket.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=BucketName,ParameterValue=greenchainz-public-assets

# Check deployment status
aws cloudformation describe-stacks \
  --stack-name greenchainz-s3-bucket \
  --query 'Stacks[0].StackStatus'

# Get the outputs (including access keys)
aws cloudformation describe-stacks \
  --stack-name greenchainz-s3-bucket \
  --query 'Stacks[0].Outputs'
```

### Update Backend Environment Variables

After deployment, add these to your backend `.env` file:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1  # or your preferred region
AWS_ACCESS_KEY_ID=<AccessKeyId from outputs>
AWS_SECRET_ACCESS_KEY=<SecretAccessKey from outputs>
AWS_S3_BUCKET_NAME=greenchainz-public-assets
AWS_S3_BUCKET_URL=<BucketURL from outputs>
```

### What This Creates

1. **S3 Bucket** (`greenchainz-public-assets`)
   - Public read access for all files
   - CORS enabled for browser uploads
   - Versioning enabled for file history

2. **IAM User** (`greenchainz-backend-service`)
   - Dedicated service account for your backend
   - Access keys for programmatic access

3. **IAM Policy**
   - PutObject: Upload new files
   - DeleteObject: Remove files
   - GetObject: Retrieve files
   - ListBucket: List bucket contents

### Usage in Backend Code

```javascript
// Example Node.js code to upload a file
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async function uploadFile(fileBuffer, fileName) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: "application/pdf", // adjust based on file type
    ACL: "public-read",
  };

  const result = await s3.upload(params).promise();
  return result.Location; // Public URL of the uploaded file
}
```

### Security Notes

⚠️ **IMPORTANT:**

- Never commit the access keys to git
- Store them securely in environment variables or secret management
- The secret access key is only shown once during stack creation
- Rotate access keys periodically for security

### Update the Stack

To update the infrastructure:

```bash
aws cloudformation update-stack \
  --stack-name greenchainz-s3-bucket \
  --template-body file://s3-public-bucket.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

### Delete the Stack

To remove all resources:

```bash
# First, empty the bucket
aws s3 rm s3://greenchainz-public-assets --recursive

# Then delete the stack
aws cloudformation delete-stack \
  --stack-name greenchainz-s3-bucket
```
