require("module-alias/register");
require("dotenv").config();
const express = require("express");
const path = require("path");
const authRoutes = require("@/routes/authRoutes");
const userRoutes = require("@/routes/userRoutes");
const jamesRoutes = require("@/routes/james/matchingRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", jamesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}...`);
});
