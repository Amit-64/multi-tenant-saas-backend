const express = require("express");
const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const {authenticate}= require("../middleware/auth.middleware");
const {authLimiter} = require('../middleware/rateLimiter');
const { registerSchema, loginSchema,refreshTokenSchema } = require("../utils/auth.validation");

const router = express.Router();
router.post("/register",authLimiter,validate(registerSchema), authController.register);
router.post("/login",authLimiter,validate(loginSchema), authController.login);
router.post('/logout', authenticate, validate(refreshTokenSchema), authController.logout);
router.post('/refresh',authLimiter,validate(refreshTokenSchema),authController.refresh);
router.get("/me", authenticate, authController.getMe);
module.exports = router;
