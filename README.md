# verify.substr8labs.com

Public verification service for RunProof artifacts.

## Features

- **Hash Lookup**: Verify runs by hash
- **File Upload**: Upload and verify RunProof `.tgz` files
- **Badge API**: Generate verification badges for GitHub READMEs

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Verification UI |
| `/api/verify/:hash` | GET | Verify by hash |
| `/api/verify` | POST | Upload and verify RunProof |
| `/badge/:hash` | GET | SVG verification badge |

## Badge Usage

Add to your README:

```markdown
![Verified by Substr8](https://verify.substr8labs.com/badge/<run_hash>)
```

## Development

```bash
npm install
npm run dev
```

## Deploy

Deployed to Vercel. Push to main triggers auto-deploy.

## License

© 2026 Substr8 Labs
