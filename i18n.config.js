"use strict";

const i18n = require("i18n");
const path = require("path");

i18n.configure({
  locales: ["en_US"],
  defaultLocale: "en_US",
  directory: path.join(__dirname, "locales"),
  objectNotation: true,
  updateFiles: false
});

module.exports = i18n;
