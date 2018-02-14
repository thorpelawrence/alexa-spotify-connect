var fs = require('fs');
var utterances = require('alexa-utterances');

var locales = {
    "de-DE": require("./locales/de-DE.json")
};

for (var locale in locales) {
    console.log(locale + ":");
    for (var intent in locales[locale]) {
        locales[locale][intent].forEach(template => {
            utterances(template).forEach(utterance => {
                console.log(intent, utterance.trim());
            });
        });
    }
    console.log();
}
