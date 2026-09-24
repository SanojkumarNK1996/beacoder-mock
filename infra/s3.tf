resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.mock_page_url}-${random_id.suffix.hex}"
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "frontend_public_read" {
  statement {
    sid    = "PublicReadGetObject"
    effect = "Allow"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "frontend_public_read" {
  bucket     = aws_s3_bucket.frontend.id
  policy     = data.aws_iam_policy_document.frontend_public_read.json
  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

resource "aws_s3_bucket" "deployment" {
  bucket = "${var.project_name}-${var.environment}-deployment-${random_id.suffix.hex}"
}

resource "aws_s3_bucket_public_access_block" "deployment" {
  bucket = aws_s3_bucket.deployment.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

locals {
  frontend_files = fileset(var.frontend_dist_path, "**/*")
}

resource "aws_s3_object" "frontend" {
  for_each = local.frontend_files

  bucket = aws_s3_bucket.frontend.id
  key    = each.value
  source = "${var.frontend_dist_path}/${each.value}"
  etag   = filemd5("${var.frontend_dist_path}/${each.value}")
  content_type = lookup({
    "html" = "text/html",
    "css"  = "text/css",
    "js"   = "application/javascript",
    "json" = "application/json",
    "svg"  = "image/svg+xml",
    "png"  = "image/png",
    "jpg"  = "image/jpeg",
    "ico"  = "image/x-icon"
  }, try(element(split(".", each.value), length(split(".", each.value)) - 1), ""), "application/octet-stream")
}

data "archive_file" "backend" {
  type        = "zip"
  source_dir  = "../beacoder-mock-backend"
  output_path = "${path.module}/.terraform/backend.zip"
  excludes    = ["node_modules", ".git", "*.log"]
}

resource "aws_s3_object" "backend" {
  bucket = aws_s3_bucket.deployment.id
  key    = "backend/backend.zip"
  source = data.archive_file.backend.output_path
  etag   = data.archive_file.backend.output_md5
}
