const userService = require('../services/user.service');
const auditService = require('../services/audit.service');

const getAllUsers = async (req, res, next) => {
  try {
    const data = await userService.getAllUsers(req.user.tenantId);
    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user.tenantId);

    await auditService.logEvent({
      tenantId: req.user.tenantId,
      actorId: req.user.userId,
      action: 'USER_CREATED',
      resource: 'users',
      resourceId: user.id,
      payload: { email: user.email, roles: user.roles },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const user = await userService.updateUserRole({
      targetUserId: req.params.id,
      roleName: req.body.role,
      tenantId: req.user.tenantId,
      requestingUserId: req.user.userId,
    });

    await auditService.logEvent({
      tenantId: req.user.tenantId,
      actorId: req.user.userId,
      action: 'USER_ROLE_UPDATED',
      resource: 'users',
      resourceId: user.id,
      payload: { targetEmail: user.email, newRole: req.body.role },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUserRole,
};