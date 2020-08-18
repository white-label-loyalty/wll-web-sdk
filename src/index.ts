import * as Fingerprint2 from 'fingerprintjs2';

export class WllWebSdk {

  private apiKey?: string;
  private campaignId?: string;
  private userToken?: any;
  private sessionId?: string;


  public async init(apiKey: string, campaignId: string, callback: any) {
    this.apiKey = apiKey;
    this.campaignId = campaignId;
    // Check session storage and see if we already have session token and user token
    let sessionUserToken =  sessionStorage.getItem('hash');
    let sessionId =  sessionStorage.getItem('sessionId');
    console.log("Init, checking session storage");
    console.log(sessionId)
    console.log(sessionUserToken)
    if (sessionId && sessionUserToken) {
      console.log( 'Init sdk, sessionId exists: ' + sessionId);
      this.sessionId = sessionId;
      this.userToken = JSON.parse(sessionUserToken);
      callback(this.userToken);
    } else {
      // if session id isn't available, make a new session
      if( document.readyState !== 'loading' ) {
          console.log( 'Init sdk, document is already ready, just execute code here' );
          const userToken = await this.getHashTokenAndFingerprint();
          callback(userToken);
      } else {
        const _this = this;
          document.addEventListener('DOMContentLoaded', async function () {
              console.log( 'Init sdk, document was not ready, place code here' );
            const userToken = await _this.getHashTokenAndFingerprint();
            callback(userToken);
          });
      }
    }
  }

  // this.getAccessToken // called before every api, if not in memory.

  public getExistingUser = () => {
    // this returns a user entity after init, and if present then there is no need for the client
    // to verify email. 
    // also, they can show the email id in a welcome msg
    return this.userToken.userProfile;
  }

  // if existinguser if available, clients needs to show welcome and logout/not you(?) button
  // this.logout () => gets new token from hub, removes memory user, and removes session storage

  // The email provided here is pre-verified by the customer. 
  // this can be skipped if user is already available
  public async signupUsingEmail(emailAddress: string, callback: any) {
    // get user entity and use it load form and allow patch
    // check if email is same new (get or create user) -> then this.fillUserDetails(user)
    // or if we already have user entity, match emailids. if not same logout()
    // else this.fillUserDetails(user)

    if (!this.apiKey || !this.campaignId || !this.userToken || !this.sessionId) {
      throw Error("SDK hasn't been initialized yet. Call init() first!")
    }

    if (!emailAddress) {
      throw Error("Provide a valid email address");
    }

    let userProfile;
    if (this.userToken.userProfile && this.userToken.userProfile.emailAddress && this.userToken.userProfile.emailAddress !== emailAddress) {
      // USE CASE: If email address doesn't match the session user profile, this might be another visitor
      // logout();
      throw Error("Email address doesn't match existing user profile")
    } else if (this.userToken.userProfile && this.userToken.userProfile.emailAddress && this.userToken.userProfile.emailAddress === emailAddress) {
       // Use existing profile if the email address matches, no need to sign in
       // USE CASE: Mostly used for users whose profiles (at least with an email address) our systems could find based on their user token hash.
      userProfile = this.userToken.userProfile;
    } else { 
      // Sign in and get existing profile details from server if no userProfile exists in session
      // USE CASE: Mostly used for new users, or users whose user token hash didn't exist in our system to fetch a user profile.
      userProfile = await new Promise(async (resolve, reject) => {

        const data = {
          sessionId: this.sessionId,
          userProfile: {
            emailAddress: emailAddress
          }
        }

        // console.log("data:" + JSON.stringify(data))

        const baseUrl = "http://127.0.0.1:8080/v1";
        let response = await fetch( baseUrl + '/user_tokens/' + this.userToken.token + '/anon_user_profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-api-key': this.apiKey!
          },
          body: JSON.stringify(data),
        });
        console.log(response)

        if (response.ok) {
          let responseData = await response.json();
          resolve(responseData.data);
        } else {
          if (response.status === 400 || response.status === 404 || response.status === 403) {
            let responseData = await response.json();
            reject(responseData);
          } else {
            reject(response);
          }
        }
        
      });
    }

    this.userToken.userProfile = userProfile;
    sessionStorage.setItem('hash', JSON.stringify(this.userToken));
    callback(userProfile);
  } 

  public async fillUserDetails(userProfile: any, callback: any) {

    console.log("User profile submitted:");
    console.log(userProfile);
    if (!this.apiKey || !this.campaignId || !this.userToken || !this.sessionId) {
      throw Error("SDK hasn't been initialized yet. Call init() first!")
    }

    if (!this.userToken.userProfile || !this.userToken.userProfile.emailAddress) {
      throw Error("The user hasn't been signedUp yet! Sign up using email first");
    }

    if (this.userToken.userProfile && this.userToken.userProfile.emailAddress && this.userToken.userProfile.emailAddress !== userProfile.emailAddress) {
      // Something really wrong happened here. The emailAddress matching should have happened during signup.
      throw Error("Email address doesn't match existing user profile")
    }

    const userProfileSaved = await new Promise(async (resolve, reject) => {

      const data = {
        sessionId: this.sessionId,
        userProfile: userProfile
      }

      console.log("data:" + JSON.stringify(data))

      const baseUrl = "http://127.0.0.1:8080/v1";
      let response = await fetch( baseUrl + '/user_tokens/' + this.userToken.token + '/anon_user_profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': this.apiKey!
        },
        body: JSON.stringify(data),
      });
      console.log(response)

      if (response.ok) {
        let responseData = await response.json();
        resolve(responseData.data);
      } else {
        if (response.status === 400 || response.status === 404 || response.status === 403) {
          let responseData = await response.json();
          reject(responseData);
        } else {
          reject(response);
        }
      }
      
    });

    this.userToken.userProfile = userProfileSaved;
    sessionStorage.setItem('hash', JSON.stringify(this.userToken));
    callback(userProfileSaved);
  }

    private getParams(url: string) {
      var params: any = {};
      var parser = document.createElement('a');
      parser.href = url;
      var query = parser.search.substring(1);
      var vars = query.split('&');
      for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split('=');
          params[pair[0]] = decodeURIComponent(pair[1]);
      }
      return params;
    };
  
    private async getHashTokenAndFingerprint() {
      const x =  this.getParams(window.location.href);
      console.log("params", x);
      if (!x.hash) {
        window.location.replace("http://fphub.wlloyalty.net" + 
          "?id=" + this.apiKey + "&loc=" + window.location.href);
      } else {
          console.log("got the hash", x.hash);
          document.getElementById("hash")!.innerHTML = "Here's your hash token: " + x.hash;
          window.history.replaceState(null, "", window.location.pathname);
          // await this.loadScript("../node_modules/wll-web-sdk/dist/pf.min.js");
          const fingerprintComponents = await this.getFingerprint();
          try {
            
            const sessionData: any = await this.createUserSession(x.hash, fingerprintComponents, this.campaignId!);
            console.log(sessionData);
            this.sessionId = sessionData.data.id;
            this.userToken = sessionData.data.userToken;
            sessionStorage.setItem('hash', JSON.stringify(this.userToken));
            sessionStorage.setItem('sessionId', this.sessionId!);
            return this.userToken;
          } catch (err) {
            console.error("Error while creating session: " + JSON.stringify(err))
          }
        }
    }

    private async getFingerprint() {
      console.log("Getting fingerprint")
      return new Promise(async (resolve) => {
        
            setTimeout(async function () {
                Fingerprint2.get(async function (components: any) {
                  console.log(components) // an array of components: {key: ..., value: ...}
                  //  var values = components.map(function (component) { return component.value })
                  var canvas =  components.find((component: any) => component.key === "canvas");
                          var canvasValues = canvas.value;
                          var canvasValuesString = canvasValues.join('');

                          console.log("canvas" + canvasValuesString)
                          var fonts =  components.find((component: any) => component.key === "fonts");
                          var fontsValues = fonts.value;
                          var fontsValueString = fontsValues.join('');
                          console.log("fonts" + fontsValueString)

                      // var murmur = Fingerprint2.x64hash128(values.join(''), 31) 
                      var murmur = Fingerprint2.x64hash128(canvasValuesString+fontsValueString, 31)                         
                      console.log("fingerprint: "+ murmur);
                      if (components) {
                        components.push({hash: murmur})
                      }
                      document.getElementById("fingerprint")!.innerHTML = "Here's your fingerprint: " + murmur;
                      resolve(components);
          // Call backend API to create session and then save session token and user token in session storage
          // also the user entity is saved locally here, and fetched using getExistingUser
          // await loadScript("auth0.min.js");
          // try {
          //   const accessToken = await getManagementAuthToken();
          //   console.log("Access token final:" + accessToken);
          // } catch (err) {
          //   console.log("Got an error:" + JSON.stringify(err));
          // }
          })  
        }, 500)  
    });
   };

   private async createUserSession(token: string, fingerprint: any, campaignId: string) {
    
    return new Promise(async (resolve, reject) => {

      const data = {
        source: 'CAMPAIGN',
        sourceId: campaignId,
        deviceFingerprint: fingerprint
      }

      // console.log("data:" + JSON.stringify(data))
      console.log(this.apiKey);

      const baseUrl = "http://127.0.0.1:8080/v1";
      let response = await fetch( baseUrl + '/user_tokens/' + token + '/user_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': this.apiKey!
        },
        body: JSON.stringify(data),
      });
      console.log(response)

      if (response.ok) {
        let responseData = await response.json();
        resolve(responseData);
      } else {
        if (response.status === 400 || response.status === 404 || response.status === 403) {
          let responseData = await response.json();
          reject(responseData);
        } else {
          reject(response);
        }
      }
      
    });
   }
}
