# Connect Control for Spotify - Landing Page

Control Spotify Connect devices with Alexa

Source code available from: https://github.com/thorpelawrence/alexa-spotify-connect

May require a Spotify Premium account for some devices

DISCLAIMER:
This product is not endorsed, certified or otherwise approved in any way by Spotify. Spotify is the registered trade mark of the Spotify Group.

Click below to log in to Spotify

<a id="login-link">Log in</a>

<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js"></script>
<script src="https://unpkg.com/@ungap/url-search-params@0.1.2/min.js"></script>
<script>
  params=new URLSearchParams(location.search);
  $("#login-link").attr("href", "https://accounts.spotify.com/authorize?nosignup=true&" + params.toString());
</script>
