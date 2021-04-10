<div align="center">
<p><img src="https://angular.io/assets/images/logos/angular/angular.svg" height="152"></p>

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Conventional Changelog](https://img.shields.io/badge/changelog-conventional-brightgreen.svg)](http://conventional-changelog.github.io)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

![angular version](https://img.shields.io/github/package-json/dependency-version/miaborde/katlama/@angular/core?label=angular&logo=angular)

[demo (en-US)](https://miaborde.github.io/katlama/en-US) - [demo (fr)](https://miaborde.github.io/katlama/fr) - [changelog](./CHANGELOG.md)

</div>

## Run it in development

### Local Node.js

You can run this project in watch/debug mode in local dev environment, to do so you need [Node.js](https://nodejs.org).

**Example :**

```bash
# install dependencies
npm i
# run in development mode, default language
npm run start
# run in development mode, in french
npm run start:fr
```

### VSCode debugger

If you use [Visual Studio Code](https://code.visualstudio.com/) You can easily launch this app in debug mode, you need this [extension](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) (automatically added if you accept recommended extensions), and Google Chrome. All settings are already done in **.vscode** folder. Follow this [guide](https://github.com/microsoft/vscode-recipes/tree/master/Angular-CLI) to know more.

> **Use Chromium instead of Chrome on Linux distros**
>
> create an alias with this command : `sudo ln -s /usr/bin/chromium /usr/bin/google-chrome`, path can be different on your distro !

## Run it in production

### Containerized

You can run this project in production mode in container, to do so you just need [Docker](https://docs.docker.com/get-docker/).

**Example :**

```bash
# with docker only
docker build -t katlama .
docker run -d -p 80:80 -p 443:443 --name katlama katlama

# if you have Docker AND Node.js installed you can use short commands :
npm run docker:build:prod
npm run docker:prod
```

## Documentation

- **Code documentation:** this project use [Compodoc](https://compodoc.app/guides/getting-started.html) a documentation tool for Angular & Nestjs applications. It generates a static documentation of your application.

**Example :**

```bash
# code documentation: build doc website and open it
npm run doc
```

## Git flow

This project respects [Conventional commits](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit), a Git commit convention made by the Angular team. Basically, every pull request should end up with one commit and a standardized commit message.

To easily respect this a tool is provided: [Commitizen](https://github.com/commitizen/cz-cli) called with `npm run cz` command, you are not obligated to use it, if you make your commits manually they will be tested too.

> **Attention !**
> Do not commit without a **node_modules** folder at the root of the project (run `npm i` command to get it), otherwise your commit and your code will not trigger `lint` / `format` / `cz` scripts.

**Example :**

```bash
# add your changes
git add .
# commit with commitizen-cli
npm run cz
# push changes
git push

# if your commit fail you can perform changes and retry with previous message
npm run cz -- --retry
```

## Create a release

This project respects [Semantic Versioning](https://semver.org).
To easily respect this specification a tool is provided: [Standard-version](https://github.com/conventional-changelog/standard-version).

> **Note:** commit or stash any changes before create a release.

**Example :**

```bash
# add your changes
git add .

# perform release modifications, and commit all staged changes
npm run release
# OR
npm run release:alpha

# push your changes, keep version tag
git push --follow-tags
```

> **When you perform a release you automatically perform the following actions :**
>
> - increment version number in package.json (uses the `fix:` and `feat:` tags to establish the semantic versioning)
> - add a git tag
> - build Github Pages demo
> - update **CHANGELOG.md**

## Internationalization

This project is available in multiple languages, it implements [Angular internationalization](https://angular.io/guide/i18n). If you run it in containerized mode Nginx server redirects users to the correct version of the app, according to their browser language.

When you add/modify/delete a localized string in project you have to update locale to generate new **messages.xlf** file and translate the new string in **messages.{fr,others}.xlf** file(s). To do this, it is advisable to use a translation software like [Poedit](https://poedit.net/).

**Example :**

```bash
# update locale
npm run locale
```

> When you update locale you automatically perform the following actions :
>
> - update **messages.xlf** with angular built-in internationalization module
> - merge **messages.xlf** and **messages.fr.xlf** using [ngx-i18nsupport-lib](https://github.com/martinroob/ngx-i18nsupport-lib)

## Performances monitoring

- **Source map explorer:** determines which file each byte in your minified code came from. It shows you a treemap visualization to help you debug where all the code is coming from.

- **Webdev measure:** analyzes web apps and web pages, collecting modern performance metrics and insights on developer best practices. [Click here to check your app](https://web.dev/measure/)

**Example :**

```bash
# analyze your webpack bundle with source-map-explorer
npm run analyze
```

## Make it yours

- Clone this project and move into it
- Reset git history : `rm -rf .git && git init`
- Run `npm ci` after reset git history (important for pre-commit hooks)
- Replace ALL `katlama` occurrence with your project name
- Replace ALL `miaborde` occurrence with your Github username
- Replace ALL `Angular progressive web app starter.` occurrence with your project description
- Change icons in **assets** folder, You can generate yours with [pwa-asset-generator](https://www.npmjs.com/package/pwa-asset-generator)
- You're good to go :)
