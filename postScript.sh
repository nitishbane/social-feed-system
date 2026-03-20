#!/bin/bash
# Your post-deployment script

echo "=== Post-Deployment Started ==="
echo "Current directory: $(pwd)"
echo "Current user: $(whoami)"
echo "Timestamp: $(date)"

# Navigate to deployment directory
cd /home/ec2-user/deploy

echo "=== Deployment Directory Contents ==="
ls -la

echo "=== Post-Deployment Completed ==="
exit 0
