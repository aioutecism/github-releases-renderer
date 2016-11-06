const fs = require('fs');
const request = require('request');
const program = require('commander');

program
    .command('run <author> <repo> <in-file> <out-file>')
    .option('-c --count <count>', 'Count of releases to render.')
    .option('-t --token <token>', 'Personal Access Token for API request.')
    .action((author, repo, inFile, outFile, options) => {
        getReleases(author, repo, options, (error, releases) => {
            if (error) {
                console.error(error);
                return;
            }

            save(releases, inFile, outFile);
        });
    });

const templateRegexp = /```releases\r?\n([\s\S]*)```/g;

const getHeaders = (options) => {
    const headers = {
        'User-Agent': 'github-releases-renderer',
    };

    if (process.env['GITHUB_RELEASE_RENDERER_TOKEN']) {
        headers['Authorization'] = `Token ${process.env['GITHUB_RELEASE_RENDERER_TOKEN']}`;
    }

    if (options.token) {
        headers['Authorization'] = `Token ${options.token}`;
    }

    return headers;
};

const getOptions = (options) => {
    const result = Object.assign({}, {
        count: 10,
    }, options);

    result.count = parseInt(result.count, 10);

    return result;
};

const getReleases = (author, repo, options, callback) => {
    options = getOptions(options);

    const urlBase = `https://api.github.com/repos/${author}/${repo}/releases`;
    const headers = getHeaders(options);

    once = (result, page, total) => {
        request({
            url: urlBase + `?page=${page}`,
            headers
        }, ((error, response, body) => {
            if (error) {
                callback(error);
                return;
            }

            if (response.statusCode !== 200) {
                callback(new Error(`Request failed with status code: ${response.statusCode}`));
                return;
            }

            const releases = JSON.parse(body);
            result.push.apply(result, releases);

            total += releases.length;

            if (releases.length === 0 || (options.count !== 0 && total >= options.count)) {
                result.splice(options.count);
                callback(null, result);
                return;
            }

            once(result, page + 1, total);
        }));
    };

    once([], 1, 0);
};

const save = (releases, inFile, outFile) => {
    const sourceContent = fs.readFileSync(inFile, 'utf8');

    const renderedContent = sourceContent.replace(templateRegexp, (match) => {
        const template = match.replace(templateRegexp, '$1');

        const releasesStrings = releases.map((release) => {
            return template.replace(/\$\{[a-z_]+\}/ig, (match) => {
                const key = match.substring(2, match.length - 1);
                return release[key] !== undefined ? release[key] : match;
            });
        });

        return releasesStrings.join('').trim();
    });

    fs.writeFileSync(outFile, renderedContent);
};

program.parse(process.argv);
