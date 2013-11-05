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
  }

  form.addEventListener('submit', function (e) {

    e.preventDefault();

    if (!input.value.length) {
      error.show();
    } else {
      location.href = '/' + version.value + '/' + input.value;
    }
  });

  input.addEventListener('keydown', error.clear);

}());
