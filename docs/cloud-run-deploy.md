# Cloud Run Deploy Runbook

This app is ready for a Google Cloud Run deployment without bundling local secrets, raw rosters, extracted athlete names, or browser test artifacts.

Current deployment:

- Service: `become-team-usa`
- Region: `us-central1`
- URL: https://become-team-usa-822611143160.us-central1.run.app

## Required Google Cloud setup

- Enable Cloud Run, Artifact Registry, Cloud Build, Vertex AI, and Cloud Billing Budget APIs.
- Use a dedicated runtime service account with the `Vertex AI User` role.
- Configure a budget alert before judging traffic starts.
- Keep `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GEMINI_MODEL`, and `GEMINI_TIMEOUT_MS` as Cloud Run environment variables.
- Do not upload service account key files to the app image. Cloud Run should use the runtime service account identity.

## Predeploy verification

Run these before deploying:

```bash
npm run compliance:lint
npm run etl:build
npm run typecheck
npm run lint
npm run test
npm run build
npm run gemini:smoke
```

Run the onboarding browser smoke from an unrestricted local terminal:

```bash
npm run smoke:onboarding
```

## Build and deploy

Replace the placeholders, then run:

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export SERVICE="become-team-usa"
export REPOSITORY="become-team-usa"
export IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$SERVICE:$(date +%Y%m%d-%H%M%S)"

gcloud config set project "$PROJECT_ID"
gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Become Team USA Cloud Run images"

gcloud builds submit --tag "$IMAGE"

gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --service-account "become-team-usa-runtime@$PROJECT_ID.iam.gserviceaccount.com" \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION,GEMINI_MODEL=gemini-2.5-pro,GEMINI_TIMEOUT_MS=30000" \
  --min-instances 1 \
  --max-instances 5
```

## Postdeploy smoke

```bash
curl -s -I "https://YOUR_CLOUD_RUN_URL/"
curl -s "https://YOUR_CLOUD_RUN_URL/api/match" \
  -H "content-type: application/json" \
  --data '{"heightCm":178,"weightKg":72,"wingspanCm":181,"quiz":{"tempo":"steady","power":"explosive","focus":"precision","terrain":"court","team":"solo"},"webcamStatus":"skipped"}'
```

Confirm the API response includes `"isFallback":false` during the judging window.
