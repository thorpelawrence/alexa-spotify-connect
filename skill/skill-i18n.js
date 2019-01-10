const utterances = require('alexa-utterances');
const chalk = require('chalk');

var locales = {
    "de-DE": require("./locales/de-DE.json"),
    "fr-FR": require("./locales/fr-FR.json"),
    "it-IT": require("./locales/it-IT.json"),
    "es-ES": require("./locales/es-ES.json")
};

for (var locale in locales) {
    console.log(chalk.bgRed(locale + ":") + chalk.cyan(" " + locales[locale]["intents"].length + " intents"));
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
    for (var intent in locales[locale]["intents"]) {
        var samples = [];
        locales[locale]["intents"][intent]["samples"].forEach(template => {
            utterances(template).forEach(utterance => {
                samples.push(utterance.trim());
            });
        });

        var slots = [];
        for (var slot in locales[locale]["intents"][intent]["slots"]) {
            slots.push({
                "name": slot,
                "type": locales[locale]["intents"][intent]["slots"][slot]
            });
        }

        skillbuilder.intents.push({
            "name": locales[locale]["intents"][intent]["name"],
            "slots": slots,
            "samples": samples
        });
    }
    console.log(JSON.stringify(skillbuilder, null, 2));
    console.log();
}
