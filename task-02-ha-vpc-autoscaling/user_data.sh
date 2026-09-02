#!/bin/bash
sudo yum update -y
sudo yum install -y httpd
sudo systemctl start httpd
sudo systemctl enable httpd

TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
AVAILABILITY_ZONE=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)

cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>High Availability Web App</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; background-color: #1e293b; color: #f8fafc; }
        .card { background: #0f172a; padding: 30px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        h1 { color: #38bdf8; }
        .highlight { color: #4ade80; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🚀 High-Availability Auto-Scaling Cluster</h1>
        <p>Serving traffic from Instance: <span class="highlight">$INSTANCE_ID</span></p>
        <p>Availability Zone: <span class="highlight">$AVAILABILITY_ZONE</span></p>
    </div>
</body>
</html>
EOF

echo "OK" > /var/www/html/health
