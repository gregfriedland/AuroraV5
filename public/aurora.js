var settingNames;
var socket = io();


function emit(socket, msg, data, fn) {
  console.log(msg + ": sending " + JSON.stringify(data));
  socket.emit(msg, data, function (retData) {
    console.log(msg + ": received " + JSON.stringify(retData));
    fn(retData);
  });
}


socket.on('connect', function () {
  console.log('connected');
  
  emit(socket, 'get drawers', null, function (data) {
    createProgramsUI(socket, data.active.name, data.allNames);
    settingNames = Object.keys(data.active.values);
    createSettingsUI(socket, data.active.ranges);
    updateSettingsUI(socket, data.active.values);

  });
});

socket.on('disconnect', function () {
  console.log('disconnected');
});


//// Set the program on the server and get its settings; update the UI ////
function setProgram(program) {
  emit(socket, 'set drawer', program,
    function (data) {
      settingNames = Object.keys(data.values);
      createSettingsUI(socket, data.ranges);
      updateSettingsUI(socket, data.values);
    }
  )
}

//// Create the UI of the programs buttons ////
function createProgramsUI(socket, activeProgram, programs) {
  var html = "";
  for (var i=0; i<programs.length; ++i) {
    var theme = programs[i] == activeProgram ? "b" : "a";
    
    html = html + '<input type="button" data-inline="true" id="' + programs[i] + '" data-theme="' + theme + '" value="' + programs[i] + '">';
  }
  $("#programs").html(html);
  $("#programs").trigger("create");
  
  // and update the click bindings
  for (var i=0; i<programs.length; ++i) {
    $('#'+programs[i]).on('click',
                          {program:programs[i]},
                          function(event) {
                            event.preventDefault();
                            setProgram(event.data.program);
                            createProgramsUI(socket, event.data.program, programs);
                          });
  }
}


/////// Create the UI of the settings sliders //////////
function createSettingsUI(socket, settingsRanges) {
  var html = "";
  html += "<input type='button' data-inline='tre' id='randomize_settings_btn' data-theme='a' value='I feel lucky!'>";

  for (var setting in settingsRanges) {
    var min = settingsRanges[setting][0];
    var max = settingsRanges[setting][1];
    html += "<label for='"+setting+"slider'>"+setting+"</label>";
    html += "<input type='range' name='"+setting+"slider' id='"+setting+"slider' value='"+min+"' min='"+min+"' max='"+max+"' data-highlight='true'>";
  }
  $("#settings").html(html);
  $("#settings").trigger("create");
  
  bindSettingsEvents(socket);
}


///// update the ui for the settings ////
function updateSettingsUI(socket, newSettingVals) {
  // we need to unbind the slider events before we change the values
  // otherwise setting the values here will trigger sending of settings to the server
  unbindSettingsEvents();
  
  for (var i=0; i<settingNames.length; i++) {
    var setting = settingNames[i];
    console.log("updating setting: " + setting + "; " + newSettingVals[setting]);
    if (setting && newSettingVals[setting]) {
      $('#'+setting+'slider').val(newSettingVals[setting]).slider('refresh');
    }
  }
  
  // then rebind
  bindSettingsEvents(socket);
}


//// send settings to the host ////
function sendSettings(socket) {
  var settingVals = {};
  for (var i=0; i<settingNames.length; i++) {
    var setting = settingNames[i];
    settingVals[setting] = $('#'+setting+'slider').slider().val();
  }

  emit(socket, 'set settings', settingVals, null);
}


//// Bind and unbind the settings sliders ////
function bindSettingsEvents(socket) {
  for (var i=0; i<settingNames.length; i++) {
    var setting = settingNames[i];
    $('#'+setting+'slider').on("change", function( event, ui ) {
      sendSettings(socket);
    });
  }
  $('#randomize_settings_btn').click(function(event) {
    event.preventDefault();
  
    emit(socket, 'randomize settings', null, function(data) {
      updateSettingsUI(socket, data);
    });
  });
}
                                     
function unbindSettingsEvents() {
  for (var i=0; i<settingNames.length; i++) {
    var setting = settingNames[i];
    $('#'+setting+'slider').unbind();
  }
  $('#randomize_settings_btn').unbind();
}


//// Reload the output image every so often ////
var fails = 0;
function updateImage() {
  $.ajax({
    type: "GET",
    url:'/image?random='+Date.now(),
    contentType: "image/png",
    timeout: 100,
    success: function(data) {
      if (data.length != 0) {
        fails = 0;
        $('#image').attr("src", data);
        $('#image').attr("height", "300");
        $('#image').attr("width", "500");
        //console.log("Got image: " + data);
      }},
    error: function() {
        fails++;
      }});
      
  // run again if we haven't failed a bunch of times in a row
  if (fails < 10) setTimeout(updateImage, 100);
}
updateImage();



/*
var lastLeapUpdate = Date.now();
Leap.loop(function(frame) {
//Leap.loop({}, function(frame) {
  var currTime = Date.now();
  if (currTime - lastLeapUpdate < leapUpdateInterval) {
    return;
  }
  
  lastLeapUpdate = currTime;
  
  var frameString = "Hands: " + frame.hands.length + "<br />"
                + "Fingers: " + frame.fingers.length + "<br />"
                + "Tools: " + frame.tools.length + "<br />"
                + "Gestures: " + frame.gestures.length + "<br />";
  if (frame.fingers.length > 0) {
    var indexIncr = Math.floor(frame.fingers[0].tipPosition[0] / 20);
    //anim.updateIndexFunc = makeIndexIncrementFunc(indexIncr, numLeds);
    anim.config.incr = indexIncr;

    frameString += "Finger1: " + frame.fingers[0].tipPosition + "<br/>"
                 + "IndexIncr: " + indexIncr;
  }
        
  var leapTxt = document.getElementById('leap');
  leapTxt.innerHTML = frameString;
});
*/