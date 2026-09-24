resource "aws_cloudwatch_metric_alarm" "backend_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-backend-high-cpu"
  alarm_description   = "Backend EC2 CPU is above 80 percent."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    InstanceId = aws_instance.backend.id
  }
}
