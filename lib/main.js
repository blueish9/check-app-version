"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const xpath_1 = __importDefault(require("xpath"));
const xmldom_1 = require("xmldom");
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
    const doc = new xmldom_1.DOMParser().parseFromString(xml);
    const nodes = xpath_1.default.select("//title", doc);
};
main().catch((err) => core.setFailed(err));
