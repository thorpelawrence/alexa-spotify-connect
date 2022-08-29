# alexa-spotify-connect (Connect Control for Spotify)

[![Greenkeeper badge](https://badges.greenkeeper.io/thorpelawrence/alexa-spotify-connect.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/thorpelawrence/alexa-spotify-connect.svg?branch=master)](https://travis-ci.org/thorpelawrence/alexa-spotify-connect)
[![Maintainability](https://api.codeclimate.com/v1/badges/e8e6719b56106b6c5162/maintainability)](https://codeclimate.com/github/thorpelawrence/alexa-spotify-connect/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/e8e6719b56106b6c5162/test_coverage)](https://codeclimate.com/github/thorpelawrence/alexa-spotify-connect/test_coverage)
[![Coverage Status](https://coveralls.io/repos/github/thorpelawrence/alexa-spotify-connect/badge.svg?branch=master)](https://coveralls.io/github/thorpelawrence/alexa-spotify-connect?branch=master)

![](resources/icon108.png)

**Control Spotify Connect devices with Alexa**

## Alexa Skill Store
**UK**: https://www.amazon.co.uk/Lawrence-Thorpe-Connect-Control-Spotify/dp/B074KFNWFD  
**US**: https://www.amazon.com/Lawrence-Thorpe-Connect-Control-Spotify/dp/B074KFNWFD

## Contribution and development
To get started, fork this repository to make changes. If those changes would be useful in the project, feel free to make a pull request.

### Deploy the skill
1. Create a Spotify developer app at developer.spotify.com, get a client ID and client secret
2. Create an Amazon Alexa skill, choosing **custom**. When you get to the part in the Alexa developer console where you can upload/paste in JSON, run `skill/skill.js` to generate the JSON required
```
$ node skill/skill.js
```
3. Enter the application ID from the developer console into `package.json`, under the key `alexa.applicationId`. 
4. Turn on **Account linking**, choosing **"Auth Code Grant"**. Set **"Authorization URI"** to `https://accounts.spotify.com/authorize`,  **"Access Token URI"** to `https://accounts.spotify.com/api/token`, set client ID and secret, add scopes `user-read-playback-state` and `user-modify-playback-state`, and the three redirect URLs from the account linking details in your developer console for the skill
5. Deploy this webapp to somewhere that **supports HTTPS** (required for Alexa skills), for example [Render](https://render.com/)
6. Configure the skill to use an HTTPS endpoint of `https://<your-url>/<app-name>` where `app-name` is the name specified in `alexa.app('app-name')`, `connect` by default

### Adding a language
1. Check that the locale is supported by Amazon (see [list of supported locale codes](https://developer.amazon.com/docs/custom-skills/develop-skills-in-multiple-languages.html#h2-code-changes)) and get your locale code (e.g. `en-GB`)
2. Create a locale file in `locales/{LOCALE-CODE}.json` (see existing locales for formatting), please do not change the placeholder value names (in double curly brackets e.g. `{{name}}`)
3. Create a localised _interaction model_ used by Skill Builder in `skill/locales/{LOCALE-CODE}.json` (please only change the values for the samples for each intent and not the intent names or slots). The formatting should be similar to the other locales, but if more (or fewer) samples are required for the language add as many as possible (more samples mean better accuracy) (formatting done by [alexa-utterances](https://github.com/alexa-js/alexa-utterances/blob/master/README.md))
4. Add the locale to the list of locales in `skill/skill-i18n.js` (follow the format used by other locales)
5. Please also provide [publishing information](https://github.com/thorpelawrence/alexa-spotify-connect/issues/14#issuecomment-365770234) as a comment in your pull request so that it can be localised and published to Amazon in the new language
6. (Optional: _for deployment_) To create the JSON data required by Skill Builder run
```
$ node skill/skill-i18n.js
```

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## License
[MIT](LICENSE)

## Disclaimer
This product is not endorsed, certified or otherwise approved in any way by Spotify. Spotify is the registered trade mark of the Spotify Group.
