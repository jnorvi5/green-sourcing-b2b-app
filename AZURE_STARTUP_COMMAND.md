# Azure Startup Command Configuration

## Required Manual Configuration in Azure Portal

After deploying with the Next.js standalone build, you **MUST** update the startup command in Azure Portal.

### Steps:

1. Go to **Azure Portal** (https://portal.azure.com)
2. Navigate to your App Service: **greenchainz-platform**
3. In the left sidebar, click **Settings** → **Configuration**
4. Scroll to **General settings** tab
5. Update the **Startup Command** field to:
   ```bash
   node server.js
   ```
6. Click **Save** at the top
7. Click **Continue** to confirm the restart

### Why This Change?

- **Old command**: `npm start` (requires full node_modules)
- **New command**: `node server.js` (runs the standalone server directly)

The standalone build creates a self-contained `server.js` file that includes all dependencies. This is much more reliable than depending on the entire `node_modules` folder being uploaded correctly.

### Verification

After the next deployment:
1. Check the deployment logs for successful startup
2. Visit your site URL to confirm it's working
3. Look for the absence of "node_modules/.bin/next: not found" errors

### Troubleshooting

If you still see errors:
- Verify the startup command is exactly `node server.js` (no extra paths)
- Check that the workflow completed successfully and uploaded the artifact
- Review the Application logs in Azure Portal for specific error messages
