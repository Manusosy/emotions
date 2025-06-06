# Deploying the Emotions App to Vercel

This guide explains how to deploy the Emotions App to Vercel while ensuring the diagnostic tool is only visible in local development environments.

## Prerequisites

- A Vercel account
- Git repository with your code
- Node.js and npm/yarn installed locally

## Local vs. Production Environment

The application uses environment variables to control what features are enabled:

- In development (`NODE_ENV=development`), the diagnostic tool is visible
- In production (`NODE_ENV=production`), the diagnostic tool is hidden by default
- You can explicitly enable diagnostic tools in any environment by setting `VITE_ENABLE_DIAGNOSTICS=true` 

## Deployment Steps

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)

2. Log in to your Vercel account and create a new project

3. Import your repository

4. Configure the project settings:
   - Build Command: `npm run build:vercel`
   - Output Directory: `dist` (Vite's default output directory)
   - Install Command: `npm install` (or `yarn install`)

5. Environment variables (already configured in vercel.json):
   - `NODE_ENV`: `production`
   - `VITE_ENABLE_DIAGNOSTICS`: `false`
   - `VITE_API_URL`: `https://emotions-api.vercel.app`

   > Note: These environment variables are pre-configured in the vercel.json file, so you shouldn't need to set them manually during deployment.

6. Deploy the application

## Local Development

For local development, you can use a `.env.local` file with the following content:

```
NODE_ENV=development
VITE_ENABLE_DIAGNOSTICS=true
VITE_API_URL=http://localhost:3001
```

This will ensure the diagnostic tool is available during local development.

## Temporarily Enabling Diagnostics in Production

If you need to debug issues in the production environment, you can temporarily enable the diagnostic tool by:

1. Going to your project settings in Vercel
2. Overriding the environment variable `VITE_ENABLE_DIAGNOSTICS` to `true`
3. Redeploying the application
4. **Important**: Remember to remove this environment variable override after debugging to hide the tool again

## Security Considerations

- The diagnostic tool should never be enabled in production environments that are publicly accessible
- Always ensure sensitive debugging information is not exposed to end users
- Use environment variables to control feature availability based on the environment

## Troubleshooting

If the diagnostic tool is still visible in production:

1. Verify that `NODE_ENV` is set to `production` in the Vercel environment variables
2. Ensure `VITE_ENABLE_DIAGNOSTICS` is either not set or set to `false`
3. Check that the build is using the latest code with the environment checks
4. Clear Vercel's build cache and redeploy if necessary 