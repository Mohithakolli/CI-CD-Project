EC2 Deployment and CI/CD
=======================

This repository includes a GitHub Actions workflow that builds the client, packages the server and client artifacts, copies them to an EC2 Ubuntu host, and runs deployment steps (install Node, start the Node server with pm2). The Express server is configured to serve the built client from `client/dist`, so nginx is not required.

Prerequisites for the EC2 target
- Ubuntu (20.04/22.04) instance
- A user with sudo privileges (recommended: `ubuntu` or `deploy`)
- Open port 22 (SSH) and port 80 (HTTP) in the security group

Pre-Deployment Checklist
- ✅ Client app builds successfully (`npm run build` in `client/`)
- ✅ Server dependencies listed in `server/package.json` (express, cors, dotenv)
- ✅ Server listens on port 5000 and serves static files from `client/dist`
- ✅ GitHub repository is public or Actions runner has Git access
- ✅ All GitHub Secrets are set (see below)
- ✅ EC2 instance is running and accessible via SSH
- ✅ EC2 security group allows SSH (22) and HTTP (80)
- ✅ `.github/workflows/deploy.yml` is committed to `main` branch

Setup steps on the EC2 instance (one-time)

1. Create a deploy user (optional):

   sudo adduser deploy
   sudo usermod -aG sudo deploy

2. Add your public SSH key to `~/.ssh/authorized_keys` for the deploy user.

3. (Optional) You do not need `nginx`. The server will serve static files directly from `client/dist`.

GitHub Secrets required
- `EC2_HOST` — public IP or DNS of your EC2 instance
- `EC2_USER` — ssh username (e.g. `ubuntu` or `deploy`)
- `SSH_PRIVATE_KEY` — the private key matching the public key on the EC2 user
- `EC2_PORT` — optional, defaults to `22`

First Deployment Steps
1. Commit and push `.github/workflows/deploy.yml` to your `main` branch.
2. Go to your GitHub repository → Settings → Secrets and variables → Actions.
3. Add the required secrets (EC2_HOST, EC2_USER, SSH_PRIVATE_KEY).
4. Push a change to `main` or manually trigger the workflow from Actions tab.
5. Monitor the workflow execution in GitHub Actions.

Verify Deployment Success
On the EC2 instance, check:
```bash
# Verify app is running
pm2 list
pm2 logs deploy-this

# Check if client build was deployed
ls -la ~/deploy-this/client/dist/

# Check if server is listening
netstat -tlnp | grep 5000
# or: sudo ss -tlnp | grep 5000

# Access the app from your machine
curl http://<EC2_HOST>/
# Should return HTML content of the React app

# Test API endpoint
curl http://<EC2_HOST>/api/items
# Should return JSON array with tasks
```

How the workflow works
- On push to `main` the workflow builds the `client` with `npm run build`.
 - It creates `deploy.tar.gz` containing `server` and `client/dist` and copies it to `~/deploy.tar.gz` on the EC2 host.
 - Over SSH it extracts the archive to `~/deploy-this`, installs Node (if missing), installs `pm2`, and starts/restarts the Node server with `pm2`. The server serves the client build from `client/dist`.

Notes & Next steps
- The workflow assumes your API listens on port `5000` on the EC2 host. If you change the port, update the PORT env variable and the server code.
- For production readiness consider:
   - Using a domain name and configuring TLS (Let's Encrypt / Certbot) — you can terminate TLS at a load balancer or add Certbot on the instance
   - Setting `NODE_ENV=production` in pm2 or EC2 environment
   - Hardening the firewall and systemd service management

Troubleshooting
- If the upload step fails with authentication errors, verify `SSH_PRIVATE_KEY` is correct and the public key is in `~/.ssh/authorized_keys` on the EC2 user.
- Check the workflow logs in Actions and check `/home/<user>/deploy-this` on the server for extracted files and logs.

If you want, I can also:
- Add a systemd service unit instead of relying on `pm2 startup`.
- Add automatic HTTPS with Certbot.
- Make the workflow only deploy tagged releases instead of every `main` push.
