const express = require("express");
const cors = require("cors");
const router = require("./inout");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/", router);
app.use("/uploads", express.static("uploads"));

require("./connection")(app);
