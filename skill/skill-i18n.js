const utterances = require('alexa-utterances');
const chalk = (require.main === module) ? require('chalk') : null;

const locales = {
    "de-DE": require("./locales/de-DE.json"),
    "fr-FR": require("./locales/fr-FR.json"),
    "it-IT": require("./locales/it-IT.json"),
    "es-ES": require("./locales/es-ES.json"),
    "pt-BR": require("./locales/pt-BR.json")
};

const generatedLocales = Object.entries(locales).map(([name, locale]) => {
    let skillbuilder = {
        "intents": [
            {
                "name": "AMAZON.HelpIntent",
                "samples": []
            },
            {
                "name": "AMAZON.StopIntent",
                "samples": []
            },
            {
                "name": "AMAZON.CancelIntent",
                "samples": []
            }
        ]
    }
    for (var intent in locale["intents"]) {
        var samples = [];
        locale["intents"][intent]["samples"].forEach(template => {
            utterances(template).forEach(utterance => {
                samples.push(utterance.trim());
            });
        });

        var slots = [];
        for (var slot in locale["intents"][intent]["slots"]) {
            slots.push({
                "name": slot,
                "type": locale["intents"][intent]["slots"][slot]
            });
        }

        skillbuilder.intents.push({
            "name": locale["intents"][intent]["name"],
            "slots": slots,
            "samples": samples
        });
    }
    return { name, data: skillbuilder };
});

module.exports = generatedLocales;

if (require.main === module) {
    generatedLocales.forEach(locale => {
        console.log(chalk.bgRed(locale.name + ":") + " " + chalk.cyan(locale.data.intents.length + " intents"));
        console.log(JSON.stringify(locale.data, null, 2));
        console.log(chalk.magenta("=".repeat(50)));
    });
}
