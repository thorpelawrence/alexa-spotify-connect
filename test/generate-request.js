const packageApplicationId = require('../package.json').alexa.applicationId;

module.exports = {
    intentRequest: function (intentName, slots, accessToken) {
        return {
            "session": {
                "application": {
                    "applicationId": packageApplicationId
                },
                "user": {
                    "accessToken": accessToken || null
                }
            },
            "request": {
                "type": "IntentRequest",
                "intent": {
                    "name": intentName || "",
                    "slots": slots || {}
                }
            },
            "context": {
                "System": {
                    "application": {
                        "applicationId": packageApplicationId
                    },
                    "user": {
                        "userId": "amzn1.ask.account.VOID",
                        "accessToken": accessToken || null
                    }
                }
            }
        }
    },
    intentRequestSessionAttributes: function (intentName, sessionAttributes, slots, accessToken, newSession, locale) {
        return {
            "session": {
                "new": newSession || false,
                "application": {
                    "applicationId": packageApplicationId
                },
                "user": {
                    "accessToken": accessToken || null
                },
                "attributes": sessionAttributes || {}
            },
            "request": {
                "type": "IntentRequest",
                "intent": {
                    "name": intentName || "",
                    "slots": slots || {}
                },
                "locale": locale || "en-GB"
            },
            "context": {
                "System": {
                    "application": {
                        "applicationId": packageApplicationId
                    },
                    "user": {
                        "userId": "amzn1.ask.account.VOID",
                        "accessToken": accessToken || null
                    }
                }
            }
        }
    },
    requestType: function (requestType, applicationId, locale) {
        return {
            "session": {
                "application": {
                    "applicationId": applicationId || packageApplicationId
                },
                "user": {}
            },
            "request": {
                "type": requestType || "LaunchRequest",
                "locale": locale || "en-GB"
            },
            "context": {
                "System": {
                    "application": {},
                    "user": {}
                }
            }
        };
    },
    intentRequestNoSession: function (intentName) {
        return {
            "request": {
                "type": "IntentRequest",
                "intent": {
                    "name": intentName || ""
                }
            },
            "context": {
                "System": {
                    "application": {
                        "applicationId": packageApplicationId
                    },
                    "user": {
                        "userId": "amzn1.ask.account.VOID",
                        "accessToken": "example-access-token"
                    }
                }
            }
        }
    }
}
