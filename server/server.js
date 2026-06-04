require("dotenv").config();

const express = require("express");
const cors = require("cors");

const resumeRoutes = require("./routes/resumeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", resumeRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
