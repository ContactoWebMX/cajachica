-- Try adding columns (Ignore duplicate column errors if they already exist, though MySQL might halt, so let's separate them)
ALTER TABLE advances 
  ADD COLUMN project_id INT NULL,
  ADD COLUMN category_id INT NULL,
  ADD COLUMN cost_center_id INT NULL,
  ADD COLUMN department_id INT NULL;

-- Now add foreign constraints
ALTER TABLE advances
  ADD CONSTRAINT fk_advances_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_advances_category FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_advances_cc FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_advances_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Migrate project names to project_id in advances
UPDATE advances a
JOIN projects p ON a.project = p.name COLLATE utf8mb4_unicode_ci
SET a.project_id = p.id;
