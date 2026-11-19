const swaggerDocument = {
    openapi: '3.0.3',
    info: {
      title: 'Multi-Tenant Enterprise B2B SaaS API',
      version: '1.0.0',
      description:
        'Production-grade multi-tenant REST API with Granular RBAC, Refresh Token Rotation with Replay Detection, Cross-Tenant BOLA Isolation, and SHA-256 Hash-Chained Compliance Audit Logs.',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Active Server (Local or Production)',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT accessToken obtained from /auth/login',
        },
      },
    },
    tags: [
      { name: 'System', description: 'Health and liveness checks' },
      { name: 'Auth', description: 'Tenant onboarding, JWT login, refresh rotation, and logout' },
      { name: 'Users', description: 'Tenant-scoped user onboarding and RBAC role management' },
      { name: 'Customers', description: 'Tenant-isolated customer CRM operations' },
      { name: 'Audit Logs', description: 'Immutable compliance audit trail and SHA-256 chain verifier' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Server health check',
          responses: {
            200: { description: 'Server is healthy' },
          },
        },
      },
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new tenant and founding ADMIN atomically',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tenantName', 'email', 'password'],
                  properties: {
                    tenantName: { type: 'string', example: 'Acme FinTech Ltd' },
                    email: { type: 'string', format: 'email', example: 'admin@acmefintech.com' },
                    password: { type: 'string', minLength: 8, example: 'StrongPassword123!' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Tenant and founding ADMIN created' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Authenticate user and receive JWT accessToken + refreshToken',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tenantId', 'email', 'password'],
                  properties: {
                    tenantId: {
                      type: 'string',
                      format: 'uuid',
                      description: 'Copy the tenant.id UUID returned by POST /auth/register',
                      example: '00000000-0000-0000-0000-000000000000',
                    },
                    email: { type: 'string', format: 'email', example: 'admin@acmefintech.com' },
                    password: { type: 'string', example: 'StrongPassword123!' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
            429: { description: 'Too many authentication attempts' },
          },
        },
      },
  
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Rotate refresh token (revokes all sessions if token replay is detected)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string', example: 'your-refresh-token-hex' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'New accessToken and rotated refreshToken issued' },
            401: { description: 'Invalid, expired, or reused refresh token' },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Revoke current refresh token',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string', example: 'your-refresh-token-hex' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Logged out successfully' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get authenticated user claims (userId, tenantId, roles, permissions)',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Current authenticated user context' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'List all users within the caller tenant (requires users:manage)',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Tenant user list' },
            403: { description: 'Forbidden - missing users:manage permission' },
          },
        },
        post: {
          tags: ['Users'],
          summary: 'Create a new user in the caller tenant (defaults to VIEWER role)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'analyst@acmefintech.com' },
                    password: { type: 'string', minLength: 8, example: 'ViewerPassword123!' },
                    role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'VIEWER'], default: 'VIEWER' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User created' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/users/{id}/role': {
        patch: {
          tags: ['Users'],
          summary: 'Update a tenant user role and revoke their active sessions',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'VIEWER'], example: 'MANAGER' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'User role updated' },
            403: { description: 'Forbidden or self-demotion blocked' },
          },
        },
      },
      '/customers': {
        get: {
          tags: ['Customers'],
          summary: 'List all customers in caller tenant (requires customers:read)',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Customer list' },
            403: { description: 'Forbidden' },
          },
        },
        post: {
          tags: ['Customers'],
          summary: 'Create a customer in caller tenant (requires customers:create)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'phone', 'nationalId'],
                  properties: {
                    name: { type: 'string', example: 'Priya Sharma' },
                    email: { type: 'string', format: 'email', example: 'priya@enterprise.com' },
                    phone: { type: 'string', example: '9876543210' },
                    nationalId: { type: 'string', example: 'ABCDE1234F' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Customer created' },
            400: { description: 'Validation error' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/customers/{id}': {
        get: {
          tags: ['Customers'],
          summary: 'Get a single customer by ID (BOLA-isolated by tenantId)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Customer details' },
            404: { description: 'Customer not found in this tenant' },
          },
        },
        patch: {
          tags: ['Customers'],
          summary: 'Update a customer (requires customers:update)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Priya Sharma Updated' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string', example: '9876543211' },
                    nationalId: { type: 'string', example: 'ABCDE1234F' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Customer updated' },
            404: { description: 'Customer not found' },
          },
        },
        delete: {
          tags: ['Customers'],
          summary: 'Delete a customer (requires customers:delete)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Customer deleted' },
            403: { description: 'Forbidden' },
            404: { description: 'Customer not found' },
          },
        },
      },
      '/audit-logs': {
        get: {
          tags: ['Audit Logs'],
          summary: 'Retrieve paginated & filterable compliance audit logs (requires audit:read)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'resource', in: 'query', schema: { type: 'string', example: 'customers' } },
            { name: 'action', in: 'query', schema: { type: 'string', example: 'CUSTOMER_CREATED' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'Paginated audit logs' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/audit-logs/verify': {
        get: {
          tags: ['Audit Logs'],
          summary: 'Recompute & verify cryptographic SHA-256 hash chain integrity for caller tenant',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Cryptographic hash chain verification result' },
            403: { description: 'Forbidden' },
          },
        },
      },
    },
  };
  
  module.exports = swaggerDocument;
  