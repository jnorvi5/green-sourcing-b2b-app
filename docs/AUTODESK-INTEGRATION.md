# Autodesk Platform Services (APS) Integration

## Overview

This document describes the bi-directional integration between GreenChainz and Autodesk Platform Services (APS), enabling architects to:

1. **Export materials from GreenChainz to Revit** - Add sustainable materials from GreenChainz directly to Revit projects
2. **Analyze BIM models for embodied carbon** - Upload Revit models to calculate total carbon footprint and discover low-carbon alternatives

## Setup

### 1. Create Autodesk APS Application

1. Go to [Autodesk Platform Services](https://aps.autodesk.com/)
2. Sign in with your Autodesk account
3. Create a new application
4. Note your **Client ID** and **Client Secret**

### 2. Configure OAuth Callback

Add the following callback URL to your APS application:

- **Development**: `http://localhost:3001/api/autodesk/callback`
- **Production**: `https://greenchainz.com/api/autodesk/callback`

### 3. Enable Required Scopes

Enable the following OAuth scopes:

- `data:read` - Read project data
- `data:write` - Write materials to projects
- `data:create` - Create new materials
- `viewables:read` - Access 3D model data

### 4. Add Environment Variables

Add to your `.env` file:

```bash
AUTODESK_CLIENT_ID=your-client-id
AUTODESK_CLIENT_SECRET=your-client-secret
AUTODESK_CALLBACK_URL=http://localhost:3001/api/autodesk/callback
```

### 5. Run Database Migration

```bash
# Apply Autodesk integration schema
npx supabase db push
```

This creates three tables:

- `autodesk_connections` - OAuth tokens
- `autodesk_exports` - Export event tracking
- `bim_analyses` - Carbon analysis results

## Features

### Direction 1: GreenChainz → Revit

**Use Case**: Architect finds sustainable material on GreenChainz and exports it to their Revit project.

**How to Use**:

1. Navigate to any product page
2. Click "Export to Revit" button
3. If not connected, you'll be redirected to Autodesk OAuth
4. Enter your Revit project URN
5. Material is created in your Revit project with:
   - Product name
   - Manufacturer
   - EPD number
   - Carbon footprint (kg CO₂e)
   - Thermal properties
   - Recycled content %
   - Certifications

**API Endpoint**: `POST /api/autodesk/export-material`

### Direction 2: Revit → GreenChainz

**Use Case**: Architect uploads BIM model to calculate total embodied carbon and find low-carbon alternatives.

**How to Use**:

1. Navigate to `/carbon-analysis`
2. Connect to Autodesk (if not already connected)
3. Enter your model URN from Autodesk ACC or BIM 360
4. Click "Analyze Carbon Footprint"
5. View results:
   - Total embodied carbon (tons CO₂e)
   - Material breakdown with quantities
   - Carbon per material
   - Low-carbon alternatives with % reduction

**API Endpoint**: `POST /api/autodesk/analyze-model`

## API Reference

### Connect to Autodesk

```typescript
POST /api/autodesk/connect

Response:
{
  "authorization_url": "https://developer.api.autodesk.com/authentication/v2/authorize?..."
}
```

### Check Connection Status

```typescript
GET /api/autodesk/status

Response:
{
  "connected": true,
  "autodesk_user_id": "abc123",
  "autodesk_email": "user@example.com",
  "expires_at": "2025-12-03T15:00:00Z"
}
```

### Export Material to Revit

```typescript
POST /api/autodesk/export-material

Request:
{
  "product_id": "uuid",
  "revit_project_urn": "urn:adsk.wipprod:fs.file:vf.xxx"
}

Response:
{
  "success": true,
  "material_id": "material-123",
  "export_id": "uuid"
}
```

### Analyze BIM Model

```typescript
POST /api/autodesk/analyze-model

Request:
{
  "model_urn": "urn:adsk.wipprod:dm.lineage:xxx",
  "model_name": "Office Building - Level 1" // optional
}

Response:
{
  "analysis_id": "uuid",
  "status": "processing"
}
```

### Get Analysis Result

```typescript
GET /api/autodesk/analyze-model?analysis_id=uuid

Response:
{
  "id": "uuid",
  "analysis_status": "completed",
  "total_carbon_kg": 2450000,
  "analysis_data": {
    "materials": [...],
    "breakdown": {...},
    "metadata": {...}
  },
  "alternatives": [...]
}
```

## Architecture

### Database Schema

```sql
-- OAuth tokens
CREATE TABLE autodesk_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  autodesk_user_id TEXT,
  autodesk_email TEXT
);

-- Export tracking
CREATE TABLE autodesk_exports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  revit_project_urn TEXT,
  revit_material_id TEXT,
  material_name TEXT,
  export_status TEXT,
  exported_at TIMESTAMP
);

-- Carbon analyses
CREATE TABLE bim_analyses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  model_urn TEXT,
  total_carbon_kg NUMERIC,
  analysis_data JSONB,
  alternatives JSONB,
  analysis_status TEXT,
  created_at TIMESTAMP
);
```

### Services

- **`lib/integrations/autodesk/oauth.ts`** - OAuth 2.0 flow, token management
- **`lib/integrations/autodesk/material-export.ts`** - Material export to Revit
- **`lib/integrations/autodesk/material-matcher.ts`** - Fuzzy matching algorithm
- **`lib/integrations/autodesk/bim-analysis.ts`** - BIM carbon analysis

### Components

- **`components/ExportToRevitButton.tsx`** - Export button for product pages
- **`app/carbon-analysis/page.tsx`** - BIM analysis interface

## Material Matching

The integration uses **Fuse.js** for fuzzy matching to identify GreenChainz products from BIM material names.

**Matching Strategy**:

1. Exact name match (100% confidence)
2. Fuzzy name match (>80% confidence)
3. Category match (>60% confidence)
4. No match (suggests closest alternative)

**Example**:

- BIM Material: "Concrete C30/37"
- Matched Product: "Low-Carbon Concrete (30% GGBS)"
- Confidence: 85%
- Match Type: Fuzzy

## Error Handling

### Token Expiration

Tokens are automatically refreshed when:

- Token expires within 5 minutes
- API call fails with 401 Unauthorized

### Material Matching Failures

If no match is found:

- Material is still included in analysis
- Carbon footprint defaults to 0
- Marked as "No match" in results
- User can manually assign product

### API Rate Limits

- Autodesk APS has rate limits (varies by plan)
- Implement exponential backoff for retries
- Cache model data to minimize API calls

## Testing

### Manual Testing

1. **OAuth Flow**:

   - Click "Connect to Autodesk"
   - Verify redirect to Autodesk login
   - Confirm redirect back to GreenChainz
   - Check database for stored tokens

2. **Material Export**:

   - Navigate to product page
   - Click "Export to Revit"
   - Enter project URN
   - Verify material appears in Revit

3. **BIM Analysis**:
   - Go to `/carbon-analysis`
   - Enter model URN
   - Wait for processing
   - Verify carbon calculations
   - Check alternatives suggestions

### Automated Tests

```bash
# Run integration tests
npm test -- lib/integrations/autodesk
```

## Troubleshooting

### "No Autodesk connection found"

**Solution**: Click "Connect to Autodesk" to authorize the application.

### "Token expired"

**Solution**: Token should auto-refresh. If not, disconnect and reconnect.

### "Material not found in GreenChainz"

**Solution**: Material matching uses fuzzy search. Check if similar products exist in database.

### "Model translation failed"

**Solution**: Ensure model URN is correct and model is accessible in your Autodesk account.

## Limitations

### MVP Limitations

1. **Material Creation**: Currently uses mock API endpoint. Production requires Design Automation API.
2. **File Upload**: Only supports URN input. Direct `.rvt` file upload requires additional storage.
3. **Material Properties**: Limited to basic properties. Full Revit material schema not yet supported.

### Future Enhancements

- [ ] Direct `.rvt` file upload
- [ ] Real-time sync with Revit projects
- [ ] Batch material export
- [ ] Advanced material property mapping
- [ ] Cost estimation for alternatives
- [ ] LEED credit calculation

## Support

For issues or questions:

- Check [Autodesk APS Documentation](https://aps.autodesk.com/developer/documentation)
- Contact GreenChainz support
- Review API logs in Supabase dashboard
