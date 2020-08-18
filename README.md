![npm](https://img.shields.io/npm/v/wll-web-sdk?color=blue)
![npm bundle size](https://img.shields.io/bundlephobia/min/wll-web-sdk)

# For Users

## Install

```
$ npm install wll-web-sdk
```

Or import the minified packages from CDN

```html
# Add these lines at the top of your <body> or <head> in your HTML webpage

<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/fingerprintjs2@2.1.0/dist/fingerprint2.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/wll-web-sdk@<LATEST-VERSION>/dist/wllwebsdk.umd.production.min.js"></script>
```

You can also just download these js files and place them in your website's js folder

## Usage

Initialize the SDK
```js
var wll = new WllWebSdk.WllWebSdk(); # Get the object
var apiKey = "abc123"; # API Key that you got on registration

# Initialize the SDK
const userToken = wll.init(apiKey, "campaign-ABC", 
  userToken => 
  {
    console.log("UserToken (Ignore)");
    console.log(userToken);
  });

```


# For Contributors

# TSDX Bootstrap

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).

## Local Development

Below is a list of commands you will probably find useful.

### `npm start` or `yarn start`

Runs the project in development/watch mode. Your project will be rebuilt upon changes. TSDX has a special logger for you convenience. Error messages are pretty printed and formatted for compatibility VS Code's Problems tab.

<img src="https://user-images.githubusercontent.com/4060187/52168303-574d3a00-26f6-11e9-9f3b-71dbec9ebfcb.gif" width="600" />

Your library will be rebuilt if you make edits.

### `npm run build` or `yarn build`

Bundles the package to the `dist` folder.
The package is optimized and bundled with Rollup into multiple formats (CommonJS, UMD, and ES Module).

<img src="https://user-images.githubusercontent.com/4060187/52168322-a98e5b00-26f6-11e9-8cf6-222d716b75ef.gif" width="600" />

### `npm test` or `yarn test`

Runs the test watcher (Jest) in an interactive mode.
By default, runs tests related to files changed since the last commit.
