variable "aws_region" {
  description = "AWS region for the deployment."
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Short project name used in resource names."
  type        = string
  default     = "beacoder-mock"
}

variable "mock_page_url" {
  description = "URL for the mock page."
  type        = string
  default     = "interview.kyrox.ai.com"
}

variable "instance_type" {
  description = "EC2 instance type. t3.micro is suitable for a small Free Tier deployment where eligible."
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "Optional AMI ID. Leave empty to use the latest Amazon Linux 2023 x86_64 AMI."
  type        = string
  default     = ""
}

variable "key_name" {
  description = "Optional EC2 key pair name for SSH access."
  type        = string
  default     = ""
}

variable "ssh_cidr" {
  description = "CIDR allowed to SSH to the EC2 instance. Keep empty to disable SSH ingress."
  type        = string
  default     = ""
}

variable "api_base_url" {
  description = "API base URL compiled into the frontend, for example http://EC2_EIP:3010/api/v1/mock."
  type        = string
  default     = ""
}

variable "frontend_dist_path" {
  description = "Path to the built Vite dist directory, relative to this infra directory."
  type        = string
  default     = "../beacoder-mock-frontend/dist"
}
