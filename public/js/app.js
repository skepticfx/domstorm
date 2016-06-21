$(document).ready(function() {
  $.ajax('/modules/topModules.json', {
    success: function(data) {
      var topModules = data.topModules;
      topModules.forEach(function(module){
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '/modules?id=' + module.id;
        a.innerText = module.name;
        li.appendChild(a);
        document.getElementById('modulesListNode').appendChild(li);
      });
    }
  });


  // Update current browser used browser
  var browser = detect.parse(navigator.userAgent).browser;

  $('#current-browser').html('<img src="/public/imgs/browser-logos/' + browser.family + '.png"><span class="tooltip">Running on '+ browser.family + ' ' +  browser.version+'</span>');
});
