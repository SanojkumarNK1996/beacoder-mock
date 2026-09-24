# Beacoder Mock AWS infrastructure

This Terraform configuration deploys the simple mock assessment application using:

- One EC2 instance for the Node.js backend
- An Elastic IP for a stable public backend address
- An S3 website bucket for the React/Vite frontend
- A private S3 deployment bucket for the backend artifact
- An EC2 IAM role allowing the instance to download its backend artifact
- A security group allowing public API traffic on port `3010`
- A basic CloudWatch CPU alarm

The configuration uses the default VPC and its first available subnet to keep the setup small and suitable for a Free Tier-eligible account.

## Prerequisites

- Terraform 1.6 or newer
- AWS CLI configured with credentials
- An AWS account with a suitable Free Tier-eligible EC2 instance
- Node.js and npm

Run all commands from this `infra` directory.

## Deploy

1. Build the frontend once with a temporary API URL. The backend Elastic IP is created by the first Terraform apply, so the first upload is only a bootstrap step:

   ```bash
   cd ../beacoder-mock-frontend
   npm install
   VITE_API_BASE_URL=http://127.0.0.1:3010/api/v1/mock npm run build
   cd ../infra
   ```

2. Initialize Terraform and create the backend and S3 resources:

   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

3. Read the backend URL:

   ```bash
   terraform output backend_public_url
   ```

4. Rebuild the frontend with the real backend URL. Remove the trailing slash from the URL if needed:

   ```bash
   cd ../beacoder-mock-frontend
   VITE_API_BASE_URL="$(cd ../infra && terraform output -raw backend_public_url)" npm run build
   cd ../infra
   ```

5. Upload the final frontend build:

   ```bash
   terraform apply
   terraform output frontend_website_url
   ```

Open the printed frontend URL in a browser.

## Optional SSH access

SSH is disabled by default. To enable it, set both values in a local `terraform.tfvars` file:

```hcl
key_name = "your-ec2-key-pair"
ssh_cidr = "YOUR_PUBLIC_IP/32"
```

Do not use `0.0.0.0/0` for SSH.

## Important notes

- S3 website hosting is public HTTP and is intended here only for this simple assessment. Use CloudFront and HTTPS for production.
- The backend JSON data is stored on the EC2 root EBS volume. It is not a highly available database.
- The backend is publicly exposed on port `3010` because the frontend is hosted separately in S3.
- The frontend API URL is compiled at build time using `VITE_API_BASE_URL`.
- Do not commit `terraform.tfvars`, Terraform state, credentials, or generated artifacts.
- AWS Free Tier eligibility and pricing vary by account, region, public IPv4 usage, storage, and data transfer. Configure a billing alert before applying.

## Destroy

```bash
terraform destroy
```
