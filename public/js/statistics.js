'use strict';

(function (_, Chart) {

  var ctx = document.getElementById('modules-per-version').getContext('2d');
  var modulesPerVersion = new Chart(ctx).Bar({
    labels: _.uniq(_.keys(statistics.modulesPerVersion)),
    datasets: [{
      fillColor: '#428bca',
      strokeColor: '#428bca',
      data: _.values(statistics.modulesPerVersion)
    }]
  });

})(_, Chart);
