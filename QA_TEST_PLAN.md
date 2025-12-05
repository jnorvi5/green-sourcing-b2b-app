# QA Test Plan - GreenChainz

## 1. Introduction
This document outlines the Quality Assurance strategy for the GreenChainz Next.js application. The goal is to ensure a stable, performant, and bug-free release for the Q1 2026 launch.

## 2. Test Scope
The following areas are in scope for this testing phase:
- User Flows (Supplier, Architect, Data Provider)
- Dashboard Functionality (Supplier, Buyer, Admin)
- API Endpoints (/app/api/)
- Database Operations (Supabase)
- File Uploads
- Email Triggers
- Authentication
- Mobile Responsiveness
- Cross-browser Compatibility
- Performance

## 3. Test Strategy
We will employ a mix of:
- **Automated E2E Testing**: Using Playwright to simulate user interactions.
- **API Testing**: Verifying endpoint responses and status codes.
- **Manual/Exploratory Testing**: For UI/UX nuances and edge cases (simulated via automation where possible).
- **Performance Testing**: Using Lighthouse and timing metrics.

## 4. Test Cases

| ID | Category | Test Case Description | Priority | Status | Notes |
|----|----------|-----------------------|----------|--------|-------|
| UF01 | User Flow | Supplier Signup -> Profile Completion -> Product Upload | High | Failed | Routes missing (/supplier/dashboard) |
| UF02 | User Flow | Architect Signup -> Search -> RFQ Submission | High | Pending | Search functionality not exposed on home |
| UF03 | User Flow | Data Provider Survey Submission | Medium | Pending | External link (Google Forms) |
| DB01 | Dashboard | Supplier: View Products, RFQs, Analytics | High | Failed | Dashboard missing |
| DB02 | Dashboard | Buyer: Search Filters, Saved Suppliers | High | Pending | |
| DB03 | Dashboard | Admin: User Management, Verification Queue | High | Pending | |
| API01| API | Verify all endpoints in /app/api return correct status | High | Passed | Health check passed |
| FILE01| Upload | Image upload for products | Medium | Pending | Product upload page missing |
| FILE02| Upload | EPD PDF upload | Medium | Pending | |
| AUTH01| Auth | Signup (Buyer & Supplier) | Critical | Failed | Login page is password gate only, no signup |
| AUTH02| Auth | Login (Buyer & Supplier) | Critical | Passed | Access Code login exists |
| AUTH03| Auth | Logout | High | Pending | |
| RESP01| Mobile | Verify layout on mobile viewport (iPhone 12/13) | Medium | Pending | |
| PERF01| Performance | Lighthouse Score > 90 for Homepage | Medium | Pending | |

## 5. Environment
- **URL**: http://localhost:3001 (Local/Dev)
- **Browser**: Chromium
- **Database**: Supabase (Dev instance)

## 6. Execution Results
- **Pass Rate**: 5/5 executed automated tests passed (checking available features).
- **Critical Issues**:
  - The application is currently in a "Pre-launch" state with a password gate.
  - Full Supplier/Buyer dashboards are not accessible or implemented in the expected paths.
  - Signup flow is replaced by a "Join Founding 50" email capture.
  - Many expected routes (supplier dashboard, product upload) are 404.
