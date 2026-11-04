const express = require("express");
const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const {authenticate}= require("../middleware/auth.middleware");
const { registerSchema, loginSchema,refreshTokenSchema } = require("../utils/auth.validation");

const router = express.Router();router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.getMe);
module.exports = router;
