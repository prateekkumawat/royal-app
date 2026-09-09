#!/bin/bash
# AWS EC2 User Data Script for Auto Scaling Group behind ALB
# Installs Node.js, sets up the AWS ALB Web App, and starts systemd service

sudo yum update -y
sudo yum install -y git

# Install Node.js 20
curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Create app directory
sudo mkdir -p /var/www/alb-app
sudo chown -R ec2-user:ec2-user /var/www/alb-app

# Navigate to directory
cd /var/www/alb-app

# Copy application files (or git clone in CI/CD pipeline)
# For demonstration, creating a simple systemd service pointing to node app
cat << 'EOF' > /var/www/alb-app/server.js
const express = require('express');
const http = require('http');
const app = express();
const PORT = 80;

function getMetadata(path) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '169.254.169.254',
      port: 80,
      path: path,
      method: 'GET',
      timeout: 1000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    });
    req.on('error', () => resolve('local-dev'));
    req.end();
  });
}

app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/info', async (req, res) => {
  const instanceId = await getMetadata('/latest/meta-data/instance-id');
  const privateIp = await getMetadata('/latest/meta-data/local-ipv4');
  const az = await getMetadata('/latest/meta-data/placement/availability-zone');
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  res.json({
    instanceId,
    privateIp,
    availabilityZone: az,
    clientIp,
    headers: req.headers
  });
});

app.listen(PORT, () => console.log(`App running on port ${PORT}`));
EOF

# Install express
sudo npm init -y
sudo npm install express

# Setup Systemd Service
cat << EOF | sudo tee /etc/systemd/system/alb-app.service
[Unit]
Description=AWS ALB Collector Web App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/alb-app
ExecStart=/usr/bin/node /var/www/alb-app/server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start Service
sudo systemctl daemon-reload
sudo systemctl enable alb-app
sudo systemctl start alb-app
