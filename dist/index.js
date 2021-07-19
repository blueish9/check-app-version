'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

//const {Octokit} = require('@octokit/core');
var core = require('@actions/core');
var github = require('@actions/github');

var _require = require('@slack/webhook'),
    IncomingWebhook = _require.IncomingWebhook;

var moment = require('moment');
var xpath = require('xpath');
var DOMParser = require('xmldom').DOMParser;
var axios = require('axios');

var DEBUG = false;
var log = DEBUG ? console.log : core.info;

var main = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var result, version, stores, availableList;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return compareVersion();

          case 2:
            result = _context.sent;

            if (result) {
              _context.next = 5;
              break;
            }

            return _context.abrupt('return', log('!!!'));

          case 5:

            log(result);

            version = result.version, stores = result.stores;
            availableList = stores.reduce(function (message, country) {
              return message + ('\n- ' + country);
            }, '');


            webhook.send({
              text: '\n    v' + version + ' is available on App Store: ' + availableList + '\n    '
            });

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function main() {
    return _ref.apply(this, arguments);
  };
}();

var compareVersion = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
    var milestones, today, releases, latestRelease, latestVersion, stores, description, updated;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return GhRequest.GET({ url: 'milestones' });

          case 2:
            milestones = _context3.sent;

            if (!(!milestones || milestones.length < 1)) {
              _context3.next = 5;
              break;
            }

            return _context3.abrupt('return');

          case 5:
            today = moment();
            releases = milestones.filter(function (item) {
              return item.title.startsWith('v') && item.state === 'open' && moment(item.due_on).isBefore(today);
            });

            if (!(!releases || releases.length < 1)) {
              _context3.next = 9;
              break;
            }

            return _context3.abrupt('return');

          case 9:
            latestRelease = releases[0];
            latestVersion = latestRelease.title.replace('v', '');
            _context3.next = 13;
            return Promise.all(Countries.map(function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(country) {
                var html, doc, versionClass, nodes, storeVersion;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.next = 2;
                        return new Promise(function (resolve) {
                          return axios({
                            method: 'get',
                            url: getAppStoreLink(country)
                          }).then(function (response) {
                            if (response.status === 200) return resolve(response.data);
                            resolve(undefined);
                          });
                        });

                      case 2:
                        html = _context2.sent;

                        if (html) {
                          _context2.next = 5;
                          break;
                        }

                        return _context2.abrupt('return');

                      case 5:
                        doc = new DOMParser().parseFromString(html, "text/html");
                        versionClass = 'whats-new__latest__version';
                        nodes = xpath.select('//p[contains(concat(\' \',normalize-space(@class),\' \'),\' ' + versionClass + ' \')]', doc);

                        if (!(nodes.length < 1 || !nodes[0].firstChild)) {
                          _context2.next = 10;
                          break;
                        }

                        return _context2.abrupt('return');

                      case 10:
                        storeVersion = nodes[0].firstChild.data;

                        if (!storeVersion.includes(latestVersion)) {
                          _context2.next = 13;
                          break;
                        }

                        return _context2.abrupt('return', country.toUpperCase());

                      case 13:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, undefined);
              }));

              return function (_x) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 13:
            stores = _context3.sent;


            stores = stores.filter(function (st) {
              return st;
            });

            if (!(stores.length < 1)) {
              _context3.next = 17;
              break;
            }

            return _context3.abrupt('return');

          case 17:
            description = stores.reduce(function (message, country) {
              return message + country + DELIMITER;
            }, 'Available on App Store: ');
            _context3.next = 20;
            return GhRequest.PATCH({
              url: 'milestones/' + latestRelease.number,
              params: {
                description: description,
                state: stores.length === Countries.length ? 'closed' : 'open'
              }
            });

          case 20:
            updated = _context3.sent;

            if (updated) {
              _context3.next = 23;
              break;
            }

            return _context3.abrupt('return');

          case 23:
            return _context3.abrupt('return', { version: latestVersion, stores: stores });

          case 24:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function compareVersion() {
    return _ref2.apply(this, arguments);
  };
}();

//const Countries = ['sg', 'us', 'vn'];
var Countries = ['sg', 'us'];
var DELIMITER = ', ';

var ASPIRE_APP_STORE = 'https://apps.apple.com/{country}/app/aspire-business-account-card/id1514566206';
var getAppStoreLink = function getAppStoreLink(country) {
  return ASPIRE_APP_STORE.replace('{country}', country);
};

var _ref4 = function () {
  var slackConfig = {
    username: 'App Store bot',
    icon_url: 'https://www.apple.com/v/app-store/a/images/overview/icon_appstore__ev0z770zyxoy_small_2x.png'
  };

  if (DEBUG) {
    var _octokit = new Octokit({ auth: '' }); // remember to fill

    var slack_webhook = ''; // remember to fill
    var _webhook = new IncomingWebhook(slack_webhook, slackConfig);

    return [_octokit, _webhook];
  }

  var githubToken = core.getInput("token");
  var octokit = github.getOctokit(githubToken);

  var slackWebhook = core.getInput("slack_webhook");
  var webhook = new IncomingWebhook(slackWebhook, slackConfig);

  return [octokit, webhook];
}(),
    _ref5 = _slicedToArray(_ref4, 2),
    octokit = _ref5[0],
    webhook = _ref5[1];

var OWNER = 'weaspire';
var REPO = 'neobank-app';

var _map = ['GET', 'PATCH'].map(function (method) {
  return method + ' ' + ('/repos/' + OWNER + '/' + REPO + '/');
}),
    _map2 = _slicedToArray(_map, 2),
    _GET = _map2[0],
    _PATCH = _map2[1];

var GhRequest = {
  GET: function () {
    var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(_ref7) {
      var url = _ref7.url,
          params = _ref7.params;
      var response;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return octokit.request(_GET + url, params);

            case 2:
              response = _context4.sent;

              log({ response: response });

              if (!(response && response.status === 200)) {
                _context4.next = 6;
                break;
              }

              return _context4.abrupt('return', response.data);

            case 6:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined);
    }));

    return function GET(_x2) {
      return _ref6.apply(this, arguments);
    };
  }(),
  PATCH: function () {
    var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(_ref9) {
      var url = _ref9.url,
          params = _ref9.params;
      var response;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return octokit.request(_PATCH + url, params);

            case 2:
              response = _context5.sent;

              log({ response: response });

              if (!(response && response.status === 200)) {
                _context5.next = 6;
                break;
              }

              return _context5.abrupt('return', response.data);

            case 6:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, undefined);
    }));

    return function PATCH(_x3) {
      return _ref8.apply(this, arguments);
    };
  }()
};

main();