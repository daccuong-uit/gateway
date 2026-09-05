# Gateway

Gateway is the public HTTP entry point. It validates requests, applies authentication/rate limits, and proxies traffic to IAM, Media, and Social. It does not own a business database.

## Docker

From the Agent repository:

```powershell
docker compose up -d gateway
```

Health check: `http://localhost:3000/api/v1/health`.

The gateway uses `IAM_SERVICE_URL`, `MEDIA_SERVICE_URL`, and `SOCIAL_SERVICE_URL`. These are injected by Compose for container networking.

## Changes and deployment

This repository has its own CI and Docker image. Push code to the Gateway repository to run CI and publish a GHCR image. A push does not restart an existing container. Update local Docker with:

```powershell
docker compose build gateway
docker compose up -d gateway
```

Production Compose or Kubernetes must explicitly deploy the new image tag.
