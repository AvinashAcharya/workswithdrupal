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

  form.addEventListener('submit', function (e) {

    var modules = [];

    input.value.split('\n').forEach(function (module) {

      // TODO: strip any non [a-z_] chars
      var module = module.trim().toLowerCase();

      if (module.length) {
        modules.push(module);
      }
    });

    e.preventDefault();

    if (!modules.length) {
      error.show();
    } else {
      modules = (modules.length > 1) ? modules.join('+') : modules[0];
      location.href = '/' + version.value + '/' + modules;
    }
  });

  input.addEventListener('keydown', error.clear);

}());
