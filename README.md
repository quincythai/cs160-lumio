This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

One-time: Make sure you have Node.js v22 installed:

```bash
$ node --version
v22.12.0
```

Install dependencies:

```bash
npm install
```

Create a new `.env.local` file in the root of the repository with the following environment variables:

## Required Environment Variables

### 1. SHOT_SEARCH_SECRET_KEY
- **Purpose**: API key for the shot search functionality using Reagent
- **How to get it**:
  1. Go to [Reagent](https://rea.gent/noggins/expected-ostrich-1034/use)
  2. Sign in or create an account
  3. Copy the API key/secret from the Reagent dashboard
- **Example**: `SHOT_SEARCH_SECRET_KEY=your-reagent-api-key-here`

### 2. GEMINI_API_KEY
- **Purpose**: Google Gemini API key for image description generation (used in Python scripts)
- **How to get it**:
  1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
  2. Sign in with your Google account
  3. Click "Create API Key"
  4. Copy the generated API key
- **Example**: `GEMINI_API_KEY=your-gemini-api-key-here`

### 3. GOOGLE_CLOUD_PROJECT_ID
- **Purpose**: Your Google Cloud Project ID for Vertex AI services
- **How to get it**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create a new project or select an existing one
  3. The Project ID is displayed at the top of the dashboard (e.g., `zinc-shard-480118-e1`)
  4. Enable the Vertex AI API in "APIs & Services" > "Library" > search for "Vertex AI API" > "Enable"
- **Example**: `GOOGLE_CLOUD_PROJECT_ID=your-project-id-here`

### 4. GOOGLE_SERVICE_ACCOUNT_JSON
- **Purpose**: Service account credentials for authenticating with Vertex AI (for image editing)
- **How to get it**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Navigate to "IAM & Admin" > "Service Accounts"
  3. Click "Create Service Account"
  4. Give it a name (e.g., "vertex-ai-service") and click "Create and Continue"
  5. Grant it the "Vertex AI User" role
  6. Click "Continue" then "Done"
  7. Click on the created service account
  8. Go to "Keys" tab > "Add Key" > "Create new key"
  9. Select "JSON" format and click "Create"
  10. The JSON file will download automatically
  11. Copy the entire JSON content and paste it as a single-line string in your `.env.local` file (wrap in single quotes)
- **Example**: `GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id",...}'`
- **Note**: The entire JSON object should be on one line, wrapped in single quotes

### 5. VERTEX_AI_LOCATION
- **Purpose**: The Google Cloud region where Vertex AI services are available
- **Recommended values**:
  - `us-west2` (Los Angeles) - closest to California
  - `us-west1` (Oregon) - alternative
  - `us-central1` (Iowa) - fallback if model not available in other regions
- **Example**: `VERTEX_AI_LOCATION=us-west2`

## Example `.env.local` file

```bash
SHOT_SEARCH_SECRET_KEY=your-reagent-api-key
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
VERTEX_AI_LOCATION=us-west2
```

**Important**: Never commit your `.env.local` file to version control. It contains sensitive credentials.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Format files with Prettier

We use [Prettier](https://prettier.io/) to autoformat code files. Run the command below in the root directory of the repo to do so:

```sh
npx prettier ./app ./lib --write
```

## Shot database

See the [shot database README](shot-database/README.md) to see how to install required dependencies and run
the script to create part of the shot database data.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
