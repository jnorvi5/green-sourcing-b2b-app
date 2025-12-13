# Mission: Build AI Audit Agent + External Integrations

**Objective**: MVP AI Audit by Next Friday.

## Tasks

### Phase 1: Azure AI Foundry Setup (Priority: CRITICAL)

- [ ] Apply for Azure Founders Hub Credits (https://aka.ms/startup) - _User Action Required_
- [ ] Install Azure CLI - _User Action Required_
- [ ] Run `scripts/setup_azure_ai.ps1` - _Pending CLI Install_
- [ ] Create Azure Resource Group (`rg-greenchainz-ai`) - _Script will do this_
- [ ] Create Azure AI Foundry Hub/Project (`greenchainz-audit`) - _Script will do this_
- [ ] Deploy GPT-4o Model - _User Action via Portal likely needed_
- [ ] Test API with `curl`

### Phase 2: Autodesk SDA API

- [ ] Request Access
- [ ] Store Credentials

### Phase 3: AI Audit Agent Logic

- [x] Install `@azure/openai` SDK
- [x] Create Azure Client Wrapper (`lib/azure-openai.ts`)
- [x] Scaffold Audit API Endpoint (`app/api/audit/route.ts`)
- [ ] Implement Full Audit Logic with Real Data
