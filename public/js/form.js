(function () {

  'use strict';

  var form = document.getElementById('single');
  var input = document.getElementById('module');
  var version = document.getElementById('version');

  var error = {
    clear: function () {
      input.classList.remove('error');
    },
    show: function () {
      input.classList.add('error');
    }
  };

  function setDrupalVersion() {
    var versions = document.getElementsByClassName('version');
    for (var i=0; i<versions.length; i++) {
      versions.item(i).textContent = version.value;
    }
  }

  form.addEventListener('submit', function (e) {

    e.preventDefault();

    var text = input.value;
    var modules = [];

    drush.parseModules(text, function (modules) {
      if (!modules.length) {
        error.show();
      } else {
        modules = drush.modulesToUrl(modules);
        location.href = '/' + version.value + '/' + modules;
      }
    });

  }, false);

  input.addEventListener('keydown', error.clear, false);
  version.addEventListener('change', setDrupalVersion, false)

  setDrupalVersion();
}());
