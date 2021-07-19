//const {Octokit} = require('@octokit/core');
const core = require('@actions/core');
const github = require('@actions/github');

const {IncomingWebhook} = require('@slack/webhook');

const moment = require('moment');
const xpath = require('xpath');
const DOMParser = require('xmldom').DOMParser;
const axios = require('axios');

const DEBUG = false;

const main = async () => {
  const result = await compareVersion();
  if (!result)
    return log('!!!');

  log(result);

  const {version, stores} = result;

  const availableList = stores.reduce((message, country) => {
    return message + `\n- ${country}`;
  }, '');

  webhook.send({
    text: `
    v${version} is available on App Store: ${availableList}
    `,
  });
};

const compareVersion = async () => {
  const milestones = await GhRequest.GET({url: 'milestones'});
  if (!milestones || milestones.length < 1)
    return;

  const today = moment();
  const releases = milestones.filter(item => {
    return item.title.startsWith('v') && item.state === 'open' && moment(item.due_on).isBefore(today);
  });
  if (!releases || releases.length < 1)
    return;

  const latestRelease = releases[0];
  const latestVersion = latestRelease.title.replace('v', '');

  let stores = await Promise.all(Countries.map(async country => {
    const html = await new Promise(resolve => axios({
      method: 'get',
      url: getAppStoreLink(country)
    }).then(response => {
      if (response.status === 200)
        return resolve(response.data);
      resolve(undefined);
    }));

    if (!html)
      return;

    const doc = new DOMParser().parseFromString(html, "text/html");
    const versionClass = 'whats-new__latest__version';
    const nodes = xpath.select(`//p[contains(concat(' ',normalize-space(@class),' '),' ${versionClass} ')]`, doc);
    if (nodes.length < 1 || !nodes[0].firstChild)
      return;

    const storeVersion = nodes[0].firstChild.data;
    if (storeVersion.includes(latestVersion)) {
      return country.toUpperCase();
    }
  }));

  stores = stores.filter(st => st);
  if (stores.length < 1)
    return;

  const description = stores.reduce((message, country) => {
    return message + country + DELIMITER;
  }, 'Available on App Store: ');

  const updated = await GhRequest.PATCH({
    url: 'milestones/' + latestRelease.number,
    params: {
      description,
      state: stores.length === Countries.length ? 'closed' : 'open'
    }
  });
  if (!updated)
    return;

  return {version: latestVersion, stores};
};

//const Countries = ['sg', 'us', 'vn'];
const Countries = ['sg', 'us'];
const DELIMITER = ', ';

const ASPIRE_APP_STORE = 'https://apps.apple.com/{country}/app/aspire-business-account-card/id1514566206';
const getAppStoreLink = country => ASPIRE_APP_STORE.replace('{country}', country);


const [octokit, webhook, log] = (() => {
  const slackConfig = {
    username: 'App Store bot',
    icon_url: 'https://www.apple.com/v/app-store/a/images/overview/icon_appstore__ev0z770zyxoy_small_2x.png'
  };

  if (DEBUG) {
    const octokit = new Octokit({auth: ''});  // remember to fill

    const slack_webhook = '';  // remember to fill
    const webhook = new IncomingWebhook(slack_webhook, slackConfig);

    const log = console.log;

    return [octokit, webhook, log];
  }

  const githubToken = core.getInput("token");
  const octokit = github.getOctokit(githubToken);

  const slackWebhook = core.getInput("slack_webhook");
  const webhook = new IncomingWebhook(slackWebhook, slackConfig);

  const log = core.info;

  return [octokit, webhook, log];
})();


const OWNER = 'weaspire';
const REPO = 'neobank-app';

const [GET, PATCH] = ['GET', 'PATCH'].map(method => method + ' ' + `/repos/${OWNER}/${REPO}/`);

const GhRequest = {
  GET: async ({url, params}) => {
    const response = await octokit.request(GET + url, params);
    log({response});
    if (response && response.status === 200)
      return response.data;
  },
  PATCH: async ({url, params}) => {
    const response = await octokit.request(PATCH + url, params);
    log({response});
    if (response && response.status === 200)
      return response.data;
  },
};

main();
