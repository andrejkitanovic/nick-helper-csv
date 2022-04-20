const express = require("express");
const controller = require("../src/workflow");
const inputFields = require("../src/inputFields");

const router = express.Router();

router.get("/", (req, res) => {
  const event = {
    inputFields,
  };

  const callback = (object) => {
    res.status(200).json(object.outputFields || object);
  };

  controller.main(event, callback);
});

module.exports = router;
