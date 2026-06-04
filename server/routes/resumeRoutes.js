const express = require("express");
const multer = require("multer");

const { parseResumeFn,chatFn } = require("../controller/resumeController.js");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/resume-parse", upload.single("resume"), parseResumeFn);
router.post("/chat", chatFn);

module.exports = router;
