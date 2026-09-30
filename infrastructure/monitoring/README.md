# Workermate monitoring

This stack provides Prometheus metrics, Grafana dashboards, Alertmanager notifications, host/container metrics, PostgreSQL and Redis exporters, and an HTTP readiness probe.

## Start locally

From this directory, copy `.env.example` to `.env` and replace every production placeholder:

```powershell
Copy-Item .env.example .env
docker compose --env-file .env -f docker-compose.monitoring.yml up -d
```

The API must be reachable on port `4000`. PostgreSQL and Redis exporter targets default to the ports exposed by the root Compose file. Override them in `.env` when deployment ports differ.

Local URLs are bound to loopback:

- Grafana: `http://127.0.0.1:3000`
- Prometheus: `http://127.0.0.1:9090`
- Alertmanager: `http://127.0.0.1:9093`

In production, put Grafana behind the existing reverse proxy and keep Prometheus, Alertmanager, exporters, and cAdvisor private.

## API endpoints

- `GET /health/live`: process liveness, no dependency check.
- `GET /health/ready`: PostgreSQL readiness check.
- `GET /metrics`: Prometheus metrics, including HTTP request count, latency, in-flight requests, and Node.js runtime metrics.

The frontend sends browser exceptions to Sentry only when `NEXT_PUBLIC_SENTRY_DSN` is configured. Set `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` to control tracing volume.

## Production requirements

- Use real secrets in a secret manager; do not commit `.env`.
- Configure SMTP recipients in Alertmanager and test a critical notification.
- Add the API process, PostgreSQL, and Redis to the same private network or update the exporter targets.
- Verify that Grafana dashboards load and that `/health/ready` fails when PostgreSQL is unavailable.
- Keep Prometheus and Alertmanager data volumes backed up according to the recovery policy.
