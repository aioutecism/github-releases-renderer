# github-releases-renderer

Render github releases on template.

## Usage

```
node index.js run [options] <author> <repo> <in-file> <out-file>
```

### Options

#### `-c --count <count>`

Count of releases to render.

#### `-t --token <token>`

Personal Access Token for API request.
Get [Personal Access Token](https://github.com/settings/tokens) here.

Environment varable `GITHUB_RELEASE_RENDERER_TOKEN` will be used if `-t --token` is not specified.
