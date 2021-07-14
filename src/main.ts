import * as core from "@actions/core";
import * as github from "@actions/github";
import xpath from 'xpath';
import {DOMParser } from 'xmldom';

const main = async () => {
  const context = github.context;

  const githubToken = core.getInput("token");

  const octokit = github.getOctokit(githubToken);

  /*const x = await octokit.request('GET /repos/weaspire/neobank-app/milestones/1', {
    owner,
    repo,
    milestone_number: 1
  });*/

  const xml = "<book><title>Harry Potter</title></book>";
  const doc = new DOMParser().parseFromString(xml);
  const nodes = xpath.select("//title", doc);

};

main().catch((err) => core.setFailed(err));
