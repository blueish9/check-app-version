// @ts-nocheck
//const {Octokit} = require('@octokit/core');
/*const core = require('@actions/core');
const github = require('@actions/github');*/
import * as core from "@actions/core";
import * as github from "@actions/github";

const {IncomingWebhook} = require('@slack/webhook');

const moment = require('moment');
const xpath = require('xpath');
const DOMParser = require('xmldom').DOMParser;
const axios = require('axios');

const DEBUG = false;
const log = DEBUG ? console.log : core.info;

const main = async () => {
  const result = await compareVersion();
  if (!result)
    return;

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
  if (!milestones || milestones.length < 1) {
    log('💥 failed to fetch /milestones');
    return;
  }

  const today = moment();
  const releases = milestones.filter(item => {
    return item.title.startsWith('v') && item.state === 'open' && moment(item.due_on).isBefore(today);
  });
  if (!releases || releases.length < 1) {
    log('💥 failed to find any recent release');
    return;
  }

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

    if (!html) {
      log('💥 failed to fetch App Store page of ' + country);
      return;
    }

    const doc = new DOMParser().parseFromString(html);
    const versionClass = 'whats-new__latest__version';
    const nodes = xpath.select(`//p[contains(concat(' ',normalize-space(@class),' '),' ${versionClass} ')]`, doc);
    //log(country);
    //log(html);

    if (nodes.length < 1 || !nodes[0].firstChild) {
      log('💥 failed to find latest version on App Store ' + country);
      return;
    }

    const storeVersion = nodes[0].firstChild.data;
    if (storeVersion.includes(latestVersion)) {
      return country.toUpperCase();
    }

    log('💥 failed to find any match version of ' + country);
  }));

  stores = stores.filter(st => st);
  if (stores.length < 1) {
    log('💥 no available version');
    return;
  }

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
  if (!updated) {
    log('💥 failed to update milestone');
    return;
  }

  return {version: latestVersion, stores};
};

//const Countries = ['sg', 'us', 'vn'];
const Countries = ['sg', 'us'];
const DELIMITER = ', ';

const ASPIRE_APP_STORE = 'https://apps.apple.com/{country}/app/aspire-business-account-card/id1514566206';
const getAppStoreLink = country => ASPIRE_APP_STORE.replace('{country}', country);


const [octokit, webhook] = (() => {
  const slackConfig = {
    username: 'App Store bot',
    icon_url: 'https://www.apple.com/v/app-store/a/images/overview/icon_appstore__ev0z770zyxoy_small_2x.png'
  };

  if (DEBUG) {
    const octokit = new Octokit({auth: ''});  // remember to fill

    const slack_webhook = '';  // remember to fill
    const webhook = new IncomingWebhook(slack_webhook, slackConfig);

    return [octokit, webhook];
  }

  const githubToken = core.getInput("token");
  const octokit = github.getOctokit(githubToken);

  const slackWebhook = core.getInput("slack_webhook");
  const webhook = new IncomingWebhook(slackWebhook, slackConfig);

  return [octokit, webhook];
})();


const OWNER = 'weaspire';
const REPO = 'neobank-app';

const [GET, PATCH] = ['GET', 'PATCH'].map(method => method + ' ' + `/repos/${OWNER}/${REPO}/`);

const GhRequest = {
  GET: async ({url, params}) => {
    const response = await octokit.request(GET + url, params);
    //log({response});
    if (response && response.status === 200)
      return response.data;
  },
  PATCH: async ({url, params}) => {
    const response = await octokit.request(PATCH + url, params);
    //log({response});
    if (response && response.status === 200)
      return response.data;
  },
};

main().catch((err) => core.setFailed(err));
