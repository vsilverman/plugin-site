/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const nock = require('nock');
nock.disableNetConnect();

process.env.GET_CONTENT = true;

const readText = async (fileName) => {const buffer = await fs.promises.readFile(path.join(__dirname, '__mocks__', fileName)); return buffer.toString();};

describe('Utils', () => {
    let _reporter;
    afterEach(() => {
        nock.cleanAll();
    });
    beforeEach(async () => {
        _reporter = {
            panic: (...args) => { throw args[0]; },
            activityTimer: () => {
                return {
                    start: jest.fn(),
                    end: jest.fn(),
                };
            }
        };
    });
    it('Fix GitHub URL: submodule gets expanded', () => {
        expect(utils.fixGitHubUrl('https://github.com/jenkinsci/blueocean-plugin/blueocean-bitbucket-pipeline', 'master'))
            .toBe('https://github.com/jenkinsci/blueocean-plugin/tree/master/blueocean-bitbucket-pipeline');
    });
    it('Fix GitHub URL: expanded stays expanded', () => {
        expect(utils.fixGitHubUrl('https://github.com/jenkinsci/blueocean-plugin/tree/master/blueocean-bitbucket-pipeline', 'master'))
            .toBe('https://github.com/jenkinsci/blueocean-plugin/tree/master/blueocean-bitbucket-pipeline');
    });
    it('Fix GitHub URL: no submodule, keep short', () => {
        expect(utils.fixGitHubUrl('https://github.com/jenkinsci/junit-plugin', ''))
            .toBe('https://github.com/jenkinsci/junit-plugin');
    });
    it('Get plugin data for a wiki based plugin', async () => {
        nock('https://updates.jenkins.io')
            .get('/update-center.actual.json')
            .reply(200, JSON.parse(await readText('update-center.actual.json')));
        nock('https://www.jenkins.io')
            .get('/doc/pipeline/steps/contents.json')
            .reply(200, []);
        nock('https://raw.githubusercontent.com:443')
            .get('/jenkinsci/bom/master/bom-latest/pom.xml')
            .reply(200, '');
        nock('https://raw.githubusercontent.com:443')
            .get('/jenkinsci/jenkins/master/core/src/main/resources/jenkins/split-plugins.txt')
            .reply(200, await readText('split-plugins.txt'));
        nock('https://plugins.jenkins.io')
            .get('/api/plugins/?limit=100&page=1')
            .reply(200, {
                'plugins': [
                    JSON.parse(await readText('plugins.jenkins.io.api.plugin.ios-device-connector.json'))
                ],
                'page': 1,
                'pages': 1,
                'total': 1,
                'limit': 100
            }, {'Content-Type': 'application/json'});
        nock('https://wiki.jenkins.io')
            .get('/rest/api/content?expand=body.view&title=iOS+Device+Connector+Plugin')
            .replyWithFile(200, path.join(__dirname, '__mocks__', 'wiki.jenkins.io.io-device-connector-plugin.json'), {'Content-Type': 'application/json'});

        const createNode = jest.fn().mockResolvedValue();
        const firstReleases = {'ios-device-connector': new Date(0)};
        const labelToCategory = {'ios': 'languagesPlatforms', 'builder': 'buildManagement'};
        await utils.fetchPluginData({createNode, reporter: _reporter, firstReleases, labelToCategory});
        expect(createNode.mock.calls[0][0]).toMatchSnapshot();
    });
});
