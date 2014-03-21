'use strict';

var TYPE_MODULE = 'project_module';

exports.modules = [
  {
    type: TYPE_MODULE,
    machineName: 'test_1',
    name: 'Test Module 1',
    link: 'http://example.org/1',
    creator: 'Test User 1',
    community: [1, 2],
    core: [3, 4]
  },
  {
    type: TYPE_MODULE,
    machineName: 'test_2',
    name: 'Test Module 2',
    link: 'http://example.org/2',
    creator: 'Test User 1',
    community: [1],
    core: [2]
  },
  {
    type: TYPE_MODULE,
    machineName: 'test_3',
    name: 'Test Module 3',
    link: 'http://example.org/3',
    creator: 'Test User 2',
    community: [1, 2],
    core: []
  },
  {
    type: TYPE_MODULE,
    machineName: 'test_3',
    name: 'Test Module 3',
    link: 'http://example.org/3',
    creator: 'Test User 2',
    community: [2, 1, 3],
    core: []
  }
];
