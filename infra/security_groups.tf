resource "aws_security_group" "backend" {
  name        = "${var.project_name}-${var.environment}-backend"
  description = "Public access for the Beacoder mock backend"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP API"
    from_port   = 3010
    to_port     = 3010
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.ssh_cidr == "" ? [] : [var.ssh_cidr]
    content {
      description = "SSH administration"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    description = "Outbound internet access"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
