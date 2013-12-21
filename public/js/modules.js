(function () {

  'use strict';

  var showHidden = document.getElementById('show-hidden');
  var unknownModules = document.querySelector('.modules-not-found');

  function toggleUnknownModules() {
    unknownModules.classList[showHidden.checked ? 'remove' : 'add']('hidden');
  }

  showHidden.addEventListener('click', toggleUnknownModules, false);

}());
