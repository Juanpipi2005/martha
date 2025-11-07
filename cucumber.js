module.exports = {
  default: {
    requireModule: ["ts-node/register"],
    require: ["./steps/**/*.ts"],
    format: ["progress", "json:reports/cucumber-report.json"],
    paths: ["./features/**/*.feature"],
    publishQuiet: true
  },
};
