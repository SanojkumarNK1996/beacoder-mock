output "frontend_website_url" {
  description = "Public S3 website URL for the frontend."
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "frontend_bucket_name" {
  description = "S3 bucket containing the frontend build."
  value       = aws_s3_bucket.frontend.id
}

output "backend_public_url" {
  description = "Public backend API base URL."
  value       = "http://${aws_eip.backend.public_ip}:3010/api/v1/mock"
}

output "backend_public_ip" {
  description = "Elastic public IPv4 address of the backend instance."
  value       = aws_eip.backend.public_ip
}

output "backend_instance_id" {
  description = "Backend EC2 instance ID."
  value       = aws_instance.backend.id
}

output "deployment_bucket_name" {
  description = "Private S3 bucket used to transfer the backend artifact to EC2."
  value       = aws_s3_bucket.deployment.id
}
