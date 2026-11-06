
INSERT INTO permissions (slug, description)
VALUES
  ('customers:read', 'View customer profiles and lists'),
  ('customers:create', 'Create new customer records'),
  ('customers:update', 'Update existing customer records'),
  ('customers:delete', 'Delete customer records'),
  ('users:manage', 'Create and manage users within the tenant')
ON CONFLICT (slug) DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'MANAGER'
  AND p.slug IN ('customers:read', 'customers:create', 'customers:update')
ON CONFLICT DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'VIEWER'
  AND p.slug IN ('customers:read')
ON CONFLICT DO NOTHING;