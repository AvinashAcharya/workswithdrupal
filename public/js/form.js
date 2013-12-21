(function () {

  'use strict';

  var form = document.getElementById('single');
  var input = document.getElementById('module');
  var version = document.getElementById('version');
  var titleVersion = document.querySelector('.title .version');

  var error = {
    clear: function () {
      input.classList.remove('error');
    },
    show: function () {
      input.classList.add('error');
    }
  };

  function setDrupalVersion() {
    titleVersion.textContent = version.value;
  }

  form.addEventListener('submit', function (e) {

    e.preventDefault();

    var text = input.value;
    var modules = [];

    if (drush.isPmList(text)) {
      modules = drush.parsePmList(text);
    } else {

      text.split('\n').forEach(function (module) {

        // TODO: strip any non [a-z_] chars
        var module = module.trim().toLowerCase();

        if (module.length) {
          modules.push(module);
        }
      });
    }

    if (!modules.length) {
      error.show();
    } else {
      modules = (modules.length > 1) ? modules.join('+') : modules[0];
      location.href = '/' + version.value + '/' + modules;
    }

  }, false);

  input.addEventListener('keydown', error.clear, false);
  version.addEventListener('change', setDrupalVersion, false)

  setDrupalVersion();
}());
