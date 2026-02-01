# Deployment Scripts

Automated deployment scripts for the Veo Housing Platform backend infrastructure.

## Available Scripts

### 1. `deploy-modal.sh` (Linux/Mac)
Bash script for deploying Modal serverless functions on Unix-based systems.

**Usage**:
```bash
chmod +x scripts/deploy-modal.sh
./scripts/deploy-modal.sh
```

### 2. `deploy-modal.bat` (Windows)
Batch script for deploying Modal serverless functions on Windows.

**Usage**:
```cmd
scripts\deploy-modal.bat
```

## Prerequisites

1. **Modal CLI**: Will be installed automatically if not present
2. **Python**: Python 3.8+ with pip
3. **API Keys**: `.env` file in project root with:
   - `SCANSAN_API_KEY`
   - `TFL_API_KEY`
   - `OPENAI_API_KEY`

## What the Scripts Do

1. ✅ Check for Modal CLI installation
2. ✅ Verify Modal authentication
3. ✅ Validate required API keys in `.env`
4. ✅ Create/update Modal secrets
5. ✅ Deploy all serverless functions
6. ✅ Display deployment URLs

## Deployed Functions

- **fetch_recommendations** (5min timeout, 2 retries)
- **fetch_area_data** (1min timeout, 2 retries)
- **calculate_commute** (30s timeout, 2 retries)
- **cache_warmer** (scheduled daily)

## Post-Deployment

After successful deployment:

1. Test functions:
   ```bash
   modal run modal_config.py
   ```

2. Update environment variables:
   ```
   NEXT_PUBLIC_USE_MODAL=true
   MODAL_ENDPOINT_URL=<from deployment output>
   ```

3. Update [`frontend/lib/python-bridge.ts`](../frontend/lib/python-bridge.ts) with Modal endpoints

4. Deploy frontend to Vercel

## Troubleshooting

### Authentication Failed
Run `modal token new` to re-authenticate

### Missing API Keys
Ensure `.env` file exists in project root with all required keys

### Deployment Failed
Check Modal dashboard for detailed error logs: https://modal.com/apps

## Security Notes

- Never commit `.env` file to version control
- API keys are stored securely in Modal secrets
- Secrets are encrypted at rest and in transit

## Support

For deployment issues, see:
- [`API_DOCUMENTATION.md`](../API_DOCUMENTATION.md)
- [`PLAN.md`](../PLAN.md)
- Modal docs: https://modal.com/docs
