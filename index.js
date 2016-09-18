const fs = require('fs');
const request = require('request');
const program = require('commander');

program
    .command('run <author> <repo> <in-file> <out-file>')
    .option('-c --count <count>', 'Count of releases to render.')
    .action((author, repo, inFile, outFile, options) => {
        getReleases(author, repo, (error, releases) => {
            if (error) {
                console.error(error);
                return;
            }

            save(releases, inFile, outFile, options.count);
        });
    });

const templateRegexp = /```releases\r?\n([\s\S]*)```/g;

const getReleases = (author, repo, callback) => {
    request({
        url: `https://api.github.com/repos/${author}/${repo}/releases`,
        headers: {
            'User-Agent': 'github-releases-renderer',
        },
    }, ((error, response, body) => {
        if (error) {
            callback(error);
            return;
        }

        if (response.statusCode !== 200) {
            callback(new Error(`Request failed with status code: ${response.statusCode}`));
            return;
        }

        callback(null, JSON.parse(body));
    }));
};

const save = (releases, inFile, outFile, count) => {
    if (count !== undefined) {
        releases = releases.splice(0, count);
    }

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
