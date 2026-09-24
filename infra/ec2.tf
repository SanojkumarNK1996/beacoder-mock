locals {
  backend_ami = var.ami_id != "" ? var.ami_id : data.aws_ami.amazon_linux.id
}

resource "aws_instance" "backend" {
  ami                         = local.backend_ami
  instance_type               = var.instance_type
  subnet_id                   = data.aws_subnets.default.ids[0]
  vpc_security_group_ids      = [aws_security_group.backend.id]
  iam_instance_profile        = aws_iam_instance_profile.backend.name
  key_name                    = var.key_name != "" ? var.key_name : null
  associate_public_ip_address = true

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    deployment_bucket = aws_s3_bucket.deployment.id
  })

  user_data_replace_on_change = true

  tags = {
    Name = "${var.project_name}-${var.environment}-backend"
  }

  depends_on = [aws_s3_object.backend]
}

resource "aws_eip" "backend" {
  domain = "vpc"

  instance = aws_instance.backend.id

  tags = {
    Name = "${var.project_name}-${var.environment}-backend"
  }
}
