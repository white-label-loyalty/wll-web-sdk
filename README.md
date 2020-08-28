![npm](https://img.shields.io/npm/v/wll-web-sdk?color=blue)
![npm bundle size](https://img.shields.io/bundlephobia/min/wll-web-sdk)

# For Clients

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

### 1. Initialize the SDK: init(apiKey: string, campaignId: string, callback)
Do this at the beginning of your webpage

```js
var wll = new WllWebSdk.WllWebSdk(); // Get the object
var apiKey = "abc123"; // API Key that you got during registration

var campaignId = "Campaign100"; // An ID assigned by the client (you) to uniquely identify this campaign website.
// Helps track which campaign website the user visited.

// Initialize the SDK
const userToken = wll.init(apiKey, campaignId, 
    (error, userToken) => 
    {
      if (error) {
        console.log(error);
      } else {
        console.log(userToken); // Ignore, a non-null value is enough to know that the SDK was correctly initialized.
        // FYI, userToken is used internally to ID a unique visitor.
      }
    });

```

### 2. Get User Details: getExistingUser()
Returns the UserProfile already fetched, if available.

- Use this after the init() method to check if the WLL SDK was able to correctly identify the user just based on the UserToken.
- You can also use this to get access to the UserProfile object at any time, for eg, once the user has submitted their email address.

```
let userProfile = wll.getExistingUser();
if (userProfile) {
  console.log("Welcome: " + userProfile.emailAddress);
}

```

### UserProfile
UserProfile is a unique profile corresponding to a real-world user. The primary identifier is the email address. WLL SDK progressively builds the UserProfile as a visitor visits multiple campaign websites maintained by the tenant and shares their personal information.

NOTE: The UserProfile object returned by the SDK only contains the field 'emailAddress'. This can be used to personalize the webpage to welcome the user, or to skip email address form entry.

```
export interface UserProfile {
    emailAddress: string, // Mandatory with every UserProfile submission
    givenName?: string, // First name
    familyName?: string; // Last name
    telephoneNumber?: string;
    extraFields?: { [key: string]: any }; // Key Value Pairs of any fields needed for more User information
}
```

### 3. Submit email address/Sign up using email address: signupUsingEmail(emailAddress: string, callback)
Submits an email address to uniquely identify the visitor, and links the visitor's activity to an existing UserProfile.

If the getExistingUser() method doesn't return a UserProfile after initializing the SDK, the White Label Loyalty system hasn't been able to uniquely identify the visitor.
In order to link this visitor's activities to an existing UserProfile (or create a new one, in case a UserProfile doesn't exist in the WLL system), the SDK needs an email address of the user.

NOTE: The WLL Web SDK doesn't handle email address verification, and if needed, would have to be handled by the client.

```
wll.signupUsingEmail(emailId, (error, userProfile) => {
      if (error) {
        console.log(error);
      } else {
        console.log(userProfile);
        userProfileSubmitted = userProfile;
        alert("This email ID was submitted: " + userProfileSubmitted.emailAddress);
      }
    });
```

## 4. Fill and submit user profile information: fillUserDetails(userProfile: UserProfile, callback)
Submits user information to update existing UserProfile fields in the WLL system. Works by appending fields to the existing UserProfile in the backend. If a UserProfile field submitted has a different (non-null) value than the one in the backend, the new value overrides the older value.

NOTE: Use this AFTER getExistingUser() returns a non-null UserProfile. If a UserProfile doesn't exist, first create or link an existing one by asking the user to
signupUsingEmail(). Use the emailAddress returned to build up the UserProfile below.

```
// ExtraFields is a map of key-value pairs depending on the client's needs
const extraFields = {
  policyNumber: policyNumber && policyNumber.length > 0 ? Number(policyNumber) : undefined ,
  addressStreet,
  addressCity
}

// Eg: Build the userProfile using a form
const userProfile = {
  emailAddress: userProfileSubmitted.emailAddress,
  givenName: !givenName || givenName.length === 0 ? undefined : givenName,
  familyName: !familyName || familyName.length === 0 ? undefined : familyName,
  telephoneNumber: !telephoneNumber || telephoneNumber.length === 0 ? undefined : telephoneNumber,
  extraFields
}

// Submit the userProfile
wll.fillUserDetails(userProfile, (error, userProfile) => {
  if (error) {
    console.log(error);
  } else {
    console.log(userProfile);
    userProfileSubmitted = userProfile;
    alert("This email ID's profile was submitted: " + userProfileSubmitted.emailAddress);
  }
});
```

## 4. Opt out of Profile use (Useful for GDPR compliance): setProfileAsRestricted(isRestricted: boolean = true, callback: any)
Allow user to opt out of their profile info being used.
```
wll.setProfileAsRestricted(true, (error, userProfile) => {
  if (error) {
    console.log(error);
  } else {
    alert("This email ID's profile was opted out: " + userProfile.emailAddress);
  }
});
```

# For Contributors

## Changing the Base URL of the APIs:

Copy example.babelrc and make a file name .babelrc in the root project directory.
Replace the value for "process.env.REWARDS_API_URL" with the Base URL.

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
