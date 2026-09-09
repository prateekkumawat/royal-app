# AWS Load Balancer Instance & IP Collector Web Application (Node.js)

A high-performance, modern Node.js web application engineered specifically for **AWS Application Load Balancer (ALB)** environments and EC2 Auto Scaling Groups.

## 🌟 Key Features

1. **Responding Instance Tracking**: Dynamically queries AWS IMDSv2 (`http://169.254.169.254`) to identify the exact EC2 Instance ID, Private IP (`local-ipv4`), Availability Zone (e.g., `us-east-1a`), and AWS Region serving each HTTP request.
2. **Client IP & ALB Proxy Header Collection**: Parses `X-Forwarded-For` proxy chains, `X-Forwarded-Proto` (HTTP/HTTPS), `X-Forwarded-Port`, and `X-Amzn-Trace-Id` injected by AWS ALB.
3. **Interactive Round-Robin Traffic Visualizer**:
   - Auto-polling mode to observe traffic distribution across multiple load-balanced target instances.
   - Unique instance hits counter and color-coded node chips.
   - Live stream request history log.
4. **ALB Target Group Health Check**: Pre-configured `/health` endpoint returning `HTTP 200 OK`.
5. **ASG Auto-Scaling Stress Tester**: Trigger CPU load via `/api/stress` to test Target Tracking scaling policies.

---

## 🛠 Local Setup & Running

```bash
# Navigate to the project directory
cd aws-alb-loadbalancer-app

# Install dependencies
npm install

# Start the application locally
npm start
```

Open your browser at `http://localhost:3000`.

---

## 🚀 AWS ALB EC2 Deployment

Use the included [`user_data.sh`](user_data.sh) script in your EC2 Launch Template to automatically install Node.js and start the application on EC2 instances when launched by the Auto Scaling Group.

---

## 🔗 Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | `GET` | Main Web Dashboard |
| `/health` | `GET` | Target Group Health Check (`HTTP 200 OK`) |
| `/api/info` | `GET` | Metadata JSON (Instance ID, Client IP, ALB headers) |
| `/api/stress` | `POST` | CPU load generator for Auto Scaling tests |
