const db = require('../config/db');

const createTenantWithAdmin = async ({ tenantName, email, passwordHash }) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

 
    const tenantQuery = `
      INSERT INTO tenants (name, status)
      VALUES ($1, 'ACTIVE')
      RETURNING id, name, status, created_at AS "createdAt"
    `;
    const { rows: tenantRows } = await client.query(tenantQuery, [tenantName]);
    const tenant = tenantRows[0];


    const rolesQuery = `
      INSERT INTO roles (tenant_id, name, description)
      VALUES
        ($1, 'ADMIN', 'Full administrative access within the tenant'),
        ($1, 'MANAGER', 'Can create and update resources within the tenant'),
        ($1, 'VIEWER', 'Read-only access within the tenant')
      RETURNING id, name
    `;
    const { rows: roleRows } = await client.query(rolesQuery, [tenant.id]);
    const adminRole = roleRows.find((role) => role.name === 'ADMIN');


    const mapPermissionsQuery = `
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.tenant_id = $1
        AND (
          (r.name = 'ADMIN')
          OR (r.name = 'MANAGER' AND p.slug IN ('customers:read', 'customers:create', 'customers:update'))
          OR (r.name = 'VIEWER' AND p.slug IN ('customers:read'))
        )
      ON CONFLICT DO NOTHING
    `;
    await client.query(mapPermissionsQuery, [tenant.id]);

    const userQuery = `
      INSERT INTO users (tenant_id, email, password_hash, status)
      VALUES ($1, $2, $3, 'ACTIVE')
      RETURNING id, tenant_id AS "tenantId", email, status, created_at AS "createdAt"
    `;
    const { rows: userRows } = await client.query(userQuery, [
      tenant.id,
      email.toLowerCase(),
      passwordHash,
    ]);
    const user = userRows[0];


    const userRoleQuery = `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
    `;
    await client.query(userRoleQuery, [user.id, adminRole.id]);

    await client.query('COMMIT');

    return {
      tenant,
      user: {
        ...user,
        roles: ['ADMIN'],
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findUserByEmailAndTenant = async (email, tenantId) => {
  const query = `
    SELECT u.id,
           u.tenant_id AS "tenantId",
           u.email,
           u.password_hash AS "passwordHash",
           u.status,
           COALESCE(ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
           COALESCE(ARRAY_AGG(DISTINCT p.slug) FILTER (WHERE p.slug IS NOT NULL), '{}') AS permissions
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.id
    WHERE LOWER(u.email) = LOWER($1) AND u.tenant_id = $2
    GROUP BY u.id
  `;
  const { rows } = await db.query(query, [email, tenantId]);
  return rows[0] || null;
};

const findUserById = async (userId) => {
  const query = `
    SELECT u.id,
           u.tenant_id AS "tenantId",
           u.email,
           u.status,
           COALESCE(ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
           COALESCE(ARRAY_AGG(DISTINCT p.slug) FILTER (WHERE p.slug IS NOT NULL), '{}') AS permissions
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = $1
    GROUP BY u.id
  `;
  const { rows } = await db.query(query, [userId]);
  return rows[0] || null;
};

const saveRefreshToken = async ({ userId, tokenHash, expiresAt }) => {
  const query = `
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, user_id AS "userId", expires_at AS "expiresAt", created_at AS "createdAt"
  `;
  const { rows } = await db.query(query, [userId, tokenHash, expiresAt]);
  return rows[0];
};

const findRefreshTokenByHash = async (tokenHash) => {
  const query = `
    SELECT id,
           user_id AS "userId",
           token_hash AS "tokenHash",
           expires_at AS "expiresAt",
           revoked_at AS "revokedAt",
           created_at AS "createdAt"
    FROM refresh_tokens
    WHERE token_hash = $1
  `;
  const { rows } = await db.query(query, [tokenHash]);
  return rows[0] || null;
};

const revokeRefreshTokenById = async (id) => {
  const query = `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE id = $1 AND revoked_at IS NULL
    RETURNING id
  `;
  const { rowCount } = await db.query(query, [id]);
  return rowCount > 0;
};

const revokeAllUserRefreshTokens = async (userId) => {
  const query = `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE user_id = $1 AND revoked_at IS NULL
  `;
  const { rowCount } = await db.query(query, [userId]);
  return rowCount;
};

module.exports = {
  createTenantWithAdmin,
  findUserByEmailAndTenant,
  findUserById,
  saveRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshTokenById,
  revokeAllUserRefreshTokens,
};