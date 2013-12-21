(function () {

  'use strict';

  var showHidden = document.getElementById('show-hidden');
  var unknownModules = document.querySelector('.modules-not-found');

  function toggleUnknownModules() {
    unknownModules.classList[showHidden.checked ? 'remove' : 'add']('hidden');
  }

  document.querySelector('.show-hidden').style.display = 'inline';
  showHidden.addEventListener('click', toggleUnknownModules, false);

}());
