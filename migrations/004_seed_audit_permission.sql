
INSERT INTO permissions (slug, description)
VALUES
  ('audit:read', 'View immutable compliance audit logs within the tenant')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
  AND p.slug = 'audit:read'
ON CONFLICT DO NOTHING;