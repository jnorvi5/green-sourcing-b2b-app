# Terraform Backend Configuration
# Store state in S3 with DynamoDB locking

terraform {
  backend "s3" {
    bucket         = "greenchainz-terraform-state"
    key            = "aws/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "greenchainz-terraform-locks"
  }
}

# Note: Before using this backend, create the S3 bucket and DynamoDB table:
#
# aws s3api create-bucket \
#   --bucket greenchainz-terraform-state \
#   --region us-east-1
#
# aws s3api put-bucket-versioning \
#   --bucket greenchainz-terraform-state \
#   --versioning-configuration Status=Enabled
#
# aws dynamodb create-table \
#   --table-name greenchainz-terraform-locks \
#   --attribute-definitions AttributeName=LockID,AttributeType=S \
#   --key-schema AttributeName=LockID,KeyType=HASH \
#   --billing-mode PAY_PER_REQUEST
