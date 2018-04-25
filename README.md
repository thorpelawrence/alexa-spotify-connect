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
To generate the skillBuilder JSON required for the skill in Amazon Developer console
1. Make a Spotify developer app at developer.spotify.com, get a client ID and client secret
2. Make a new Amazon Alexa skill, custom. Lots of details omitted here, but: once you get to the part in the Alexa developer console where you can upload/paste in JSON, then run `skill/skill.js` to generate the JSON required
```
node skill/skill.js
```
3. Account linking on Alexa skill: turn it on, choose "Auth Code Grant", set Authorization URI to "https://accounts.spotify.com/authorize", set "Access Token URI" to "https://accounts.spotify.com/api/token", set client ID and secret, add scopes "user-read-playback-state" and "user-modify-playback-state", add three redirect URIs:
```
https://alexa.amazon.co.jp/api/skill/link/M1OP8C9N8NBYP7
https://pitangui.amazon.com/api/skill/link/M1OP8C9N8NBYP7
https://layla.amazon.com/api/skill/link/M1OP8C9N8NBYP7
```
4. Deploy this webapp to somewhere that supports HTTPS (required for Alexa skills), for example Heroku
5. Configure the skill to use an HTTPS endpoint of `https://<your-url>/<app-name>` where `app-name` is the name specified in `alexa.app('app-name')`, `connect` by default

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## License
[MIT](LICENSE)

## Disclaimer
This product is not endorsed, certified or otherwise approved in any way by Spotify. Spotify is the registered trade mark of the Spotify Group.
