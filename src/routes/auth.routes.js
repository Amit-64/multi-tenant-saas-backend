const express = require("express");
const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { registerSchema } = require("../utils/auth.validation");

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);

module.exports = router;
