module.exports = {
    intentRequest: function (intentName, slots, accessToken) {
        return {
            "session": {
                "application": {
                    "applicationId": "amzn1.ask.skill.33d79728-0f5a-44e7-ae22-ccf0b0c0e9e0"
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
                        "applicationId": "amzn1.ask.skill.33d79728-0f5a-44e7-ae22-ccf0b0c0e9e0"
                    },
                    "user": {
                        "userId": "amzn1.ask.account.VOID"
                    }
                }
            }
        }
    },
    intentRequestSessionAttributes: function (intentName, sessionAttributes, slots, accessToken, newSession) {
        return {
            "session": {
                "new": newSession || false,
                "application": {
                    "applicationId": "amzn1.ask.skill.33d79728-0f5a-44e7-ae22-ccf0b0c0e9e0"
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
                }
            },
            "context": {
                "System": {
                    "application": {
                        "applicationId": "amzn1.ask.skill.33d79728-0f5a-44e7-ae22-ccf0b0c0e9e0"
                    },
                    "user": {
                        "userId": "amzn1.ask.account.VOID"
                    }
                }
            }
        }
    },
    requestType: function (requestType, applicationId) {
        return {
            "session": {
                "application": {
                    "applicationId": applicationId || "amzn1.ask.skill.33d79728-0f5a-44e7-ae22-ccf0b0c0e9e0"
                },
                "user": {}
            },
            "request": {
                "type": requestType || "LaunchRequest"
            }
        };
    }
}
