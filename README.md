# beacoder-mock

Simple online mock interview and technical assessment application.

## What is included

- `beacoder-mock-backend` - Node.js API and JSON file storage.
- `beacoder-mock-frontend` - React web application.
- `infra` - Terraform files that deploy the application to AWS.

The application is designed for a small public test using AWS Free Tier-eligible resources:

- Amazon S3 hosts the frontend.
- One Amazon EC2 instance runs the backend.
- The backend stores candidate data in JSON files on the EC2 disk.
- An Elastic IP provides a stable backend address.

## Deploy to AWS for beginners

The following steps are the complete deployment process. Run the commands from the project folder.

### Step 1: Install the required tools

Install these tools on your computer:

1. **AWS CLI** - https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
2. **Terraform** - https://developer.hashicorp.com/terraform/install
3. **Node.js** - https://nodejs.org/

You do not need Docker, a database, or a web server installed locally.

### Step 2: Prepare your AWS account

1. Sign in to AWS: https://console.aws.amazon.com/
2. Choose the AWS region you want to use. The default region in this project is `ap-south-1` (Mumbai).
3. Configure the AWS CLI. When prompted, enter your AWS access key, secret key, default region, and output format:

	```bash
	aws configure
	```

4. Confirm that the CLI can access your account:

	```bash
	aws sts get-caller-identity
	```

Do not share or commit your AWS access keys.

### Step 3: Build the frontend once

Terraform needs a frontend build before it can upload the website. From the project folder, run:

```bash
cd beacoder-mock-frontend
npm install
VITE_API_BASE_URL=http://127.0.0.1:3010/api/v1/mock npm run build
cd ../infra
```

The first build is temporary. It will be rebuilt with the real AWS backend address later.

### Step 4: Create the AWS resources

Run these commands from the `infra` folder:

```bash
terraform init
terraform plan
terraform apply
```

When Terraform asks `Do you want to perform these actions?`, type `yes` and press Enter.

This creates the S3 buckets, EC2 instance, security group, Elastic IP, IAM role, and CloudWatch alarm.

### Step 5: Build the frontend with the real backend address

After Step 4 finishes, run:

```bash
cd ../beacoder-mock-frontend
VITE_API_BASE_URL="$(cd ../infra && terraform output -raw backend_public_url)" npm run build
cd ../infra
```

### Step 6: Upload the final frontend

Run:

```bash
terraform apply
```

Type `yes` if Terraform asks for confirmation. Then display the public website address:

```bash
terraform output frontend_website_url
```

Copy that URL into a browser. The assessment is now publicly accessible.

### Step 7: Share the assessment

Candidate registration URL:

```text
<frontend-website-url>/test/MERN
```

Replace `<frontend-website-url>` with the URL from Step 6.

## Admin and Excel results

Admin candidate list:

```text
<frontend-website-url>/admin/candidates
```

Open this page and click **Export Excel** to download candidate registration details, scores, topic scores, status, and timestamps.

## Local development

To run the application on your computer, open two terminals.

Terminal 1:

```bash
cd beacoder-mock-backend
npm install
npm run dev
```

Terminal 2:

```bash
cd beacoder-mock-frontend
npm install
npm run dev
```

Open `http://localhost:5173/test/MERN` in your browser.

## Important AWS notes

- AWS Free Tier eligibility depends on your account, region, and resource usage.
- Public IPv4 addresses, storage, and data transfer can incur charges. Set up an AWS billing alert before deployment.
- This project uses public HTTP S3 website hosting for simplicity. It is not intended as a production security setup.
- Candidate records are stored on the EC2 disk as JSON files. They are not backed up automatically.
- The backend is public on port `3010`.
- Do not commit `terraform.tfvars`, Terraform state files, AWS credentials, or `.env` files.

## Remove the AWS deployment

To delete the resources created by Terraform:

```bash
cd infra
terraform destroy
```

Type `yes` when asked. This stops the AWS resources and prevents further resource charges, but always check the AWS console afterward.

## Application API

The deployed API base URL is printed by:

```bash
cd infra
terraform output backend_public_url
```

Available endpoints include:

```text
GET  /tests/:testId
GET  /tests/:testId/questions
POST /registrations
POST /submissions
GET  /admin/candidates
GET  /admin/candidates/:studentId
GET  /admin/candidates/export
```

## Data files

- `beacoder-mock-backend/data/tests.json` contains test configurations.
- `beacoder-mock-backend/data/candidates.json` contains candidate records and calculated results.
- `beacoder-mock-backend/questions/` contains topic-based question files.
