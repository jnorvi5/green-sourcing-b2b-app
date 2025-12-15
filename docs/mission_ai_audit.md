# Mission: Build AI Audit Agent + External Integrations

**Objective**: MVP AI Audit by Next Friday.

## Tasks

### Phase 1: Azure AI Foundry Setup (Priority: CRITICAL)

- [x] Apply for Azure Founders Hub Credits - _Initial link provided_
- [x] Install Azure CLI - _Verified via dir check_
- [x] Configure `.env.local` - _Credentials added_
- [ ] Test API - _Failed (404 Deployment Not Found). Resource `greenchainz-2025` is reachable, but deployment `auditor` does not exist._

### Phase 2: Autodesk SDA API

- [ ] Request Access
- [ ] Store Credentials

### Phase 3: AI Audit Agent Logic

- [x] Install `@azure/openai` SDK
- [x] Create Azure Client Wrapper (`lib/azure-openai.ts`)
- [x] Scaffold Audit API Endpoint (`app/api/audit/route.ts`)
- [ ] Implement Full Audit Logic with Real Data
