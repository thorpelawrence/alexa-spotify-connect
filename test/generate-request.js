module.exports = function(intentName, slots, accessToken) {
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
}