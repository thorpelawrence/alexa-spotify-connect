var token;
var refresh_token;

$(document).ready(function () {
  var params = getHashParams();
  token = params.access_token;
  refresh_token = params.refresh_token;
  if (token) {
    $("#login-button").hide();
  }

  $("#play-pause-button").click(function () {
    $.post('/playpause');
    // $.ajax({
    //   url: 'https://api.spotify.com/v1/me/player',
    //   headers: { 'Authorization': 'Bearer ' + token },
    //   success: function (data) {
    //     if (data.is_playing) {
    //       pause();
    //     }
    //     else play();
    //   }
    // });
  });

  pollPlaybackStatus();

  $("#get-devices-button").click(function () {
    $.post('/getdevices');
    // $.ajax({
    //   url: 'https://api.spotify.com/v1/me/player/devices',
    //   headers: { 'Authorization': 'Bearer ' + token },
    //   success: function (data) {
    //     $("#devices-list").empty();
    //     var active = "-1";
    //     for (var i = 0; i < data.devices.length; i++) {
    //       if (data.devices[i].is_active) active = data.devices[i].id;
    //       $("#devices-list").append("<option value=" + data.devices[i].id + ">" + data.devices[i].name + "</option>");
    //       $("#devices-list").val(active);
    //     }
    //   }
    // });
  });

  $("#devices-list").change(function () {
    $.ajax({
      method: "PUT",
      url: 'https://api.spotify.com/v1/me/player',
      headers: { 'Authorization': 'Bearer ' + token },
      data: '{"device_ids": ["' + $(this).val() + '"],"play":true}'
    });
  });

  $("#volume").change(function () {
    $.ajax({
      method: "PUT",
      url: 'https://api.spotify.com/v1/me/player/volume?volume_percent=' + $(this).val(),
      headers: { 'Authorization': 'Bearer ' + token },
    });
  });
});

function getHashParams() {
  var hashParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1);
  while (e = r.exec(q)) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

function pollPlaybackStatus() {
  $.ajax({
    url: 'https://api.spotify.com/v1/me/player',
    headers: { 'Authorization': 'Bearer ' + token },
    success: function (data) {
      if (data.is_playing) {
        $("#play-pause-button").removeClass("fa-pause");
        $("#play-pause-button").addClass("fa-play");
      }
      else {
        $("#play-pause-button").removeClass("fa-play");
        $("#play-pause-button").addClass("fa-pause");
      }
      $("#playback-status").html(data.item.name + " " + msToTime(data.progress_ms) + "/" + msToTime(data.item.duration_ms));
      $("#playback-status").attr("href", data.item.external_urls.spotify);

      setTimeout(pollPlaybackStatus, 1000);
    }
  });
}

function play() {
  $("#play-pause-button").removeClass("fa-pause");
  $("#play-pause-button").addClass("fa-play");
  $.ajax({
    method: "PUT",
    url: 'https://api.spotify.com/v1/me/player/play',
    headers: { 'Authorization': 'Bearer ' + token },
    success: function (data) {

    }
  });
}

function pause() {
  $("#play-pause-button").removeClass("fa-play");
  $("#play-pause-button").addClass("fa-pause");
  $.ajax({
    method: "PUT",
    url: 'https://api.spotify.com/v1/me/player/pause',
    headers: { 'Authorization': 'Bearer ' + token },
    success: function (data) {

    }
  });
}

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100)
    , seconds = parseInt((duration / 1000) % 60)
    , minutes = parseInt((duration / (1000 * 60)) % 60)
    , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return minutes + ":" + seconds;
}