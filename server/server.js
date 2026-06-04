require("dotenv").config();
const PORT = process.env.PORT || 5000;

const express = require("express");
const cors = require("cors");

const resumeRoutes = require("./routes/resumeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", resumeRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
