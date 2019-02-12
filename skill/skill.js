const connect = require('../connect');
const skill_i18n = require('./skill-i18n');
const chalk = (require.main === module) ? require('chalk') : null;

const generatedSkill = connect.schemas.skillBuilder();

module.exports = [
    ...skill_i18n,
    { name: 'en-GB', data: JSON.parse(generatedSkill) }
];

if (require.main === module) {
    console.log(chalk.bgRed("SKILLBUILDER JSON:"));
    console.log(generatedSkill);
}
