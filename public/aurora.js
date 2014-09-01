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
  
  emit(socket, 'get programs', null, function (data) {
    createProgramsUI(socket, data);
  });
});

socket.on('disconnect', function () {
  console.log('disconnected');
});

/////// Create the UI of the programs buttons //////////
function createProgramsUI(socket, programs) {
  var html = "";
  for (var i=0; i<programs.length; ++i) {
    html = html + '<div class="ui-block-a"><button id="' + programs[i] + '" type="submit" data-theme="a">' + programs[i] + '</button></div>';
  }
  $("#programs").html(html);
  $("#programs").trigger("create");
  
  // and update the click bindings
  for (var i=0; i<programs.length; ++i) {
    $('#'+programs[i]).on('click', {prog:programs[i]}, function(event) {
      event.preventDefault();
      
      emit(socket, 'set program', event.data.prog,
        function (settingsData) {
          settingNames = Object.keys(settingsData.values);
          createSettingsUI(socket, settingsData.ranges);
          updateSettingsUI(socket, settingsData.values);
        }
      );
    });
  }
}


/////// Create the UI of the settings sliders //////////
function createSettingsUI(socket, settingsRanges) {
  var html = "<li data-role='fieldcontain'><button type='submit' id='randomize_settings_btn' data-theme='a'>Pick settings for me!</button></li>";

  for (var setting in settingsRanges) {
    var min = settingsRanges[setting][0];
    var max = settingsRanges[setting][1];
    html += "<li data-role='fieldcontain'><label for='"+setting+"slider'>"+setting+"</label>";
    html += "<input type='range' name='"+setting+"slider' id='"+setting+"slider' value='"+min+"' min='"+min+"' max='"+max+"' data-highlight='true'></li>";
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


