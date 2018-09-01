const connect = require('../dist/connect');
const chalk = require('chalk');

console.log(chalk.bgRed("SKILLBUILDER JSON:"));
console.log(connect.schemas.skillBuilder());
console.log(chalk.magenta("=".repeat(50)));
