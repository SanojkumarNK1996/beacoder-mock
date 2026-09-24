data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "backend" {
  name               = "${var.project_name}-${var.environment}-backend"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

data "aws_iam_policy_document" "backend_s3_read" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject"
    ]
    resources = ["${aws_s3_bucket.deployment.arn}/backend/*"]
  }
}

resource "aws_iam_role_policy" "backend_s3_read" {
  name   = "read-backend-artifact"
  role   = aws_iam_role.backend.id
  policy = data.aws_iam_policy_document.backend_s3_read.json
}

resource "aws_iam_instance_profile" "backend" {
  name = "${var.project_name}-${var.environment}-backend"
  role = aws_iam_role.backend.name
}
