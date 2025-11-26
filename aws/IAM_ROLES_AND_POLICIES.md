# AWS IAM Roles and Policies

This document outlines the necessary IAM roles and permission policies for the GreenChainz AWS infrastructure, focusing on S3 storage and Lambda execution.

## 1. S3 Storage IAM Roles and Policies

### 1.1. Backend Service IAM User (`greenchainz-backend-user`)

This IAM user is designed for the backend application to interact with the private S3 bucket (`greenchainz-assets`).

**Use Case:** Allows the backend to upload, read, and delete files in the S3 bucket.

**Current Implementation (Terraform):** `terraform/main.tf`

**Policy: `greenchainz-s3-upload-policy`**

This policy grants the `greenchainz-backend-user` the following permissions:

- `s3:PutObject`: Upload/overwrite files.
- `s3:GetObject`: Read/download files.
- `s3:DeleteObject`: Delete files.
- `s3:ListBucket`: List the contents of the bucket.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::greenchainz-assets/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::greenchainz-assets"
    }
  ]
}
```

### 1.2. Lambda Function IAM Role (S3 Access)

When a Lambda function needs to access the S3 bucket, it should use an execution role with a dedicated policy.

**Use Case:** A Lambda function that processes uploaded documents or generates reports and saves them to S3.

**Recommended Policy: `lambda-s3-processing-policy`**

This policy should be attached to the Lambda's execution role. It provides both read and write access.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::greenchainz-assets/uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::greenchainz-assets/processed/*"
    }
  ]
}
```

---

## 2. Lambda Execution IAM Roles and Policies

### 2.1. EPD Sync Lambda IAM Role (`greenchainz-lambda-epd-sync-role`)

This IAM role is used by the `greenchainz-epd-sync` Lambda function.

**Use Case:** Allows the Lambda function to execute, write logs to CloudWatch, and publish error notifications to an SNS topic.

**Current Implementation (Terraform):** `terraform/lambda.tf`

**Attached Policies:**

1.  **`lambda-logging-policy`**:
    - `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`
    - Allows the function to write logs to CloudWatch.

2.  **`lambda-sns-publish-policy`**:
    - `sns:Publish`
    - Allows the function to publish messages to the `greenchainz-epd-sync-errors` SNS topic.

### 2.2. Recommended Improvement: Secure Secret Management

Currently, sensitive values like API keys and database credentials are set as environment variables in the Lambda function. A more secure approach is to use AWS Secrets Manager.

**Recommended Policy: `lambda-secrets-manager-policy`**

This policy, attached to the Lambda's execution role, allows the function to read a specific secret.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:greenchainz-secrets-AbCdEf"
    }
  ]
}
```

By adopting this, the Lambda function's code would be updated to fetch these secrets at runtime, enhancing security.
