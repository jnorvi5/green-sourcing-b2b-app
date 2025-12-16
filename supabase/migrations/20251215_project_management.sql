-- Migration: Project Management
-- Description: Adds projects and project_materials tables, links RFQs to projects.

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  architect_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Materials Table (Materials list for a project)
CREATE TABLE IF NOT EXISTS project_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC,
  unit TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'rfq_sent', 'ordered', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link RFQs to Projects
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = architect_id);

CREATE POLICY "Architects can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = architect_id);

CREATE POLICY "Architects can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = architect_id);

CREATE POLICY "Architects can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = architect_id);

-- RLS for Project Materials
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects can view materials of their projects"
  ON project_materials FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_materials.project_id
    AND projects.architect_id = auth.uid()
  ));

CREATE POLICY "Architects can insert materials to their projects"
  ON project_materials FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_materials.project_id
    AND projects.architect_id = auth.uid()
  ));

CREATE POLICY "Architects can update materials of their projects"
  ON project_materials FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_materials.project_id
    AND projects.architect_id = auth.uid()
  ));

CREATE POLICY "Architects can delete materials of their projects"
  ON project_materials FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_materials.project_id
    AND projects.architect_id = auth.uid()
  ));
