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

});
