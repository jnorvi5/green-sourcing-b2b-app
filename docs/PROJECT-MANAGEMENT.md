# Architect Project Management & RFQ Tracking Architecture

## Overview
The Project Management module allows architects and contractors to organize their material sourcing efforts by project. It bridges the gap between material discovery (Search) and procurement (RFQs).

## Core Components

### 1. Projects List (`/projects`)
-   **Purpose:** Overview of all active, planned, and completed projects.
-   **Data Source:** `projects` table.
-   **Key Features:**
    -   Summary cards with status indicators.
    -   Quick stats: Material count, RFQ count.
    -   "New Project" creation flow.

### 2. Project Detail (`/projects/[id]`)
-   **Purpose:** Central hub for a specific project's material needs.
-   **Data Source:**
    -   `projects` (Metadata)
    -   `project_materials` (Bill of Materials)
    -   `rfqs` (Requests linked to this project)
-   **Key Features:**
    -   **Material List:** Add/Edit materials required for the project.
    -   **RFQ Integration:** One-click RFQ generation from a material item.
    -   **Status Tracking:** Track items from "Planned" -> "RFQ Sent" -> "Ordered".

### 3. Database Schema
#### `projects`
-   `id`: UUID (PK)
-   `architect_id`: UUID (FK to profiles)
-   `name`: Text
-   `location`: Text
-   `status`: Text (active, planning, completed)
-   `description`: Text

#### `project_materials`
-   `id`: UUID (PK)
-   `project_id`: UUID (FK to projects)
-   `name`: Text
-   `category`: Text
-   `quantity`: Number
-   `unit`: Text
-   `status`: Text (planned, rfq_sent, ordered)

## Workflow
1.  **Create Project:** Architect defines a new project scope.
2.  **Add Materials:** Architect lists required materials (e.g., "5000 sqft Insulation").
3.  **Search & Assign:** (Future) Search catalog and assign specific products to material slots.
4.  **Create RFQ:**
    -   Architect clicks "Create RFQ" on a material.
    -   System pre-fills RFQ form with material specs.
    -   RFQ is linked to both the Project and the Supplier.

## Testing
-   **Test Mode:** The frontend supports a "Test Mode" (triggered by `test_` token prefix) to simulate data without a backend.
-   **Manual Verification:** See `verification/manual_test_report.md` for MVP verification details.
