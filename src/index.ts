import * as Fingerprint2 from 'fingerprintjs2';
import { UserProfile } from 'types';
import * as geolocator from 'geolocator';
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
    if ('development' === process.env.NODE_ENV) {
      console.log("Init, checking session storage");
      console.log(sessionId)
      console.log(sessionUserToken)
    }
    if (sessionId && sessionUserToken) {
      if ('development' === process.env.NODE_ENV) {
        console.log( 'Init sdk, sessionId exists: ' + sessionId);
      }
      this.sessionId = sessionId;
      this.userToken = JSON.parse(sessionUserToken);
      callback(null, this.userToken);
    } else {
      // if session id isn't available, make a new session
      if( document.readyState !== 'loading' ) {
          if ('development' === process.env.NODE_ENV) {
            console.log( 'Init sdk, document is already ready, just execute code here' );
          }
          try {
            const userToken = await this.getHashTokenAndFingerprint();
            callback(null, userToken);
          } catch (err) {
            callback(err);
          }
          
      } else {
        const _this = this;
          document.addEventListener('DOMContentLoaded', async function () {
            if ('development' === process.env.NODE_ENV) {
              console.log( 'Init sdk, document was not ready, place code here' );
            }
            try {
              const userToken = await _this.getHashTokenAndFingerprint();
              callback(null, userToken);
            } catch (err) {
              callback(err);
            }
          });
      }
    }
  }

  // this.getAccessToken // called before every api, if not in memory.

  public getExistingUser = () => {
    // this returns a user entity after init, and if present then there is no need for the client
    // to verify email. 
    // also, they can show the email id in a welcome msg
    return this.userToken.profile;
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
      callback(new Error("SDK hasn't been initialized yet. Call init() first!"));
    }

    if (!emailAddress) {
      callback(new Error("Provide a valid email address"));
    }

    let userProfile;
    if (this.userToken.profile && this.userToken.profile.emailAddress && this.userToken.profile.emailAddress !== emailAddress) {
      // USE CASE: If email address doesn't match the session user profile, this might be another visitor
      // logout();
      callback(new Error("Email address doesn't match existing user profile"));
    } else if (this.userToken.profile && this.userToken.profile.emailAddress && this.userToken.profile.emailAddress === emailAddress) {
       // Use existing profile if the email address matches, no need to sign in
       // USE CASE: Mostly used for users whose profiles (at least with an email address) our systems could find based on their user token hash.
      userProfile = this.userToken.profile;
    } else {
      // Sign in and get existing profile details from server if no userProfile exists in session
      // USE CASE: Mostly used for new users, or users whose user token hash didn't exist in our system to fetch a user profile.

      try {
        userProfile = await new Promise(async (resolve, reject) => {

          const data = {
            emailAddress: emailAddress
          }

          const baseUrl = process.env.REWARDS_API_URL;
          try {
            let response = await fetch( baseUrl + 'user_sessions/' + this.sessionId + '/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-api-key': this.apiKey!
              },
              body: JSON.stringify(data),
            });
            if ('development' === process.env.NODE_ENV) {
              console.log(response)
            }

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
          } catch (err) {
            callback(err);
          }
        });
      } catch (err) {
        callback(err);
      }
    }

    this.userToken.profile = userProfile;
    sessionStorage.setItem('hash', JSON.stringify(this.userToken));
    callback(null, userProfile);
  } 

  /**
   * Useful for GDPR compliance, or to let the user opt out of using their bio/profile data.
   * @param isRestricted 
   * @param callback 
   */
  public async setProfileAsRestricted(isRestricted: boolean = true, callback: any) {
    if (!this.apiKey || !this.campaignId || !this.userToken || !this.sessionId) {
      callback(new Error("SDK hasn't been initialized yet. Call init() first!"));
    }

    if (!this.userToken.profile || !this.userToken.profile.emailAddress) {
      callback(new Error("The user hasn't been signedUp yet! Sign up using email first"));
    }

    const userProfile: UserProfile = {
      emailAddress: this.userToken.profile.emailAddress,
      isRestricted
    }
    await this.fillUserDetails(userProfile, callback);
  }

  /**
   * Allows a user to update their Profile.
   * @param userProfile 
   * @param callback 
   */
  public async fillUserDetails(userProfile: UserProfile, callback: any) {

    if ('development' === process.env.NODE_ENV) {
      console.log("User profile submitted:");
      console.log(userProfile);
    }
    if (!this.apiKey || !this.campaignId || !this.userToken || !this.sessionId) {
      callback(new Error("SDK hasn't been initialized yet. Call init() first!"));
    }

    // if (!this.userToken.profile || !this.userToken.profile.emailAddress) {
    //   callback(new Error("The user hasn't been signedUp yet! Sign up using email first"));
    // }

    if (this.userToken.profile && this.userToken.profile.emailAddress && this.userToken.profile.emailAddress !== userProfile.emailAddress) {
      // Something really wrong happened here. The emailAddress matching should have happened during signup.
      callback(new Error("Email address doesn't match existing user profile"));
    }

    try {
      const userProfileSaved = await new Promise(async (resolve, reject) => {

        const data = userProfile;
        
        if ('development' === process.env.NODE_ENV) {
          console.log("data:" + JSON.stringify(data))
        }

        const baseUrl = process.env.REWARDS_API_URL;
        try {
          let response = await fetch( baseUrl + 'user_sessions/' + this.sessionId + '/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'x-api-key': this.apiKey!
            },
            body: JSON.stringify(data),
          });
          if ('development' === process.env.NODE_ENV) {
            console.log(response)
          }

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
        } catch (err) {
          reject(err);
        }
      });

      this.userToken.profile = userProfileSaved;
      sessionStorage.setItem('hash', JSON.stringify(this.userToken));
      callback(null, userProfileSaved);
    } catch (err) {
      callback(err);
    }
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
      if ('development' === process.env.NODE_ENV) {
        console.log("params", x);
      }
      if (!x.hash) {
        window.location.replace("http://fphub.wlloyalty.net" + 
          "?id=" + this.apiKey + "&loc=" + window.location.href);
      } else {
          if ('development' === process.env.NODE_ENV) {
            console.log("got the hash", x.hash);
          }
          window.history.replaceState(null, "", window.location.pathname);

          // Optionally, try getting a fingerprint
          let fingerprintComponents;
          try {
            fingerprintComponents = await this.getFingerprint();
          } catch (err) {
            if ('development' === process.env.NODE_ENV) {
              console.error("Error while getting fingerprint: " + JSON.stringify(err))
            }
          }

          let locationAndIpInfo;
          try {
            locationAndIpInfo = await this.getLocationByIP();
          } catch (err) {
            // Fail silently
            if ('development' === process.env.NODE_ENV) {
              console.error("Error while getting location by IP: " + JSON.stringify(err))
            }
          }
          try {

            const sessionData: any = await this.createUserSession(x.hash, this.campaignId!, fingerprintComponents, locationAndIpInfo);
            if ('development' === process.env.NODE_ENV) {
              console.log(sessionData);
            }
            this.sessionId = sessionData.data.id;
            this.userToken = sessionData.data.userToken;
            sessionStorage.setItem('hash', JSON.stringify(this.userToken));
            sessionStorage.setItem('sessionId', this.sessionId!);
            return this.userToken;
          } catch (err) {
            if ('development' === process.env.NODE_ENV) {
              console.error("Error while creating session: " + JSON.stringify(err))
            }
            throw err;
          }
        }
    }

    private async getLocationByIP() {
      if ('development' === process.env.NODE_ENV) {
        console.log("Getting Location by IP");
      }
      return new Promise(async (resolve, reject) => {
        var options = {
          addressLookup: false,
        };
        if (!geolocator) {
          reject(new Error("Couldn't find geolocator module"))
        }
        geolocator.locateByIP(options, function (err: any, location: any) {
          if ('development' === process.env.NODE_ENV) {
            console.log(err || location);
          }
          if (err) {
            reject(err)
          } else if (location) {
            resolve(location);
          } else {
            reject();
          }
        });
      });

    }

    private async getFingerprint() {
      if ('development' === process.env.NODE_ENV) {
        console.log("Getting fingerprint")
      }
      return new Promise(async (resolve, reject) => {
            if (!Fingerprint2) {
              reject(new Error("Couldn't find Fingerprint2 module"))
            }
            setTimeout(async function () {
                Fingerprint2.get(async function (components: any) {
                  if ('development' === process.env.NODE_ENV) {
                    console.log(components) // an array of components: {key: ..., value: ...}
                  }
                  var canvas =  components.find((component: any) => component.key === "canvas");
                          var canvasValues = canvas.value;
                          var canvasValuesString = canvasValues.join('');

                          if ('development' === process.env.NODE_ENV) {
                            console.log("canvas" + canvasValuesString)
                          }
                          var fonts =  components.find((component: any) => component.key === "fonts");
                          var fontsValues = fonts.value;
                          var fontsValueString = fontsValues.join('');
                          if ('development' === process.env.NODE_ENV) {
                            console.log("fonts" + fontsValueString)
                          }

                      // var murmur = Fingerprint2.x64hash128(values.join(''), 31) 
                      var murmur = Fingerprint2.x64hash128(canvasValuesString+fontsValueString, 31)                         
                      if ('development' === process.env.NODE_ENV) {
                        console.log("fingerprint: "+ murmur);
                      }
                      if (components) {
                        components.push({hash: murmur})
                      }
                      resolve(components);
          // Call backend API to create session and then save session token and user token in session storage
          // also the user entity is saved locally here, and fetched using getExistingUser
          })  
        }, 500)  
    });
   };

   private async createUserSession(token: string, campaignId: string, fingerprint?: any, locationAndIpInfo?: any) {
    
    return new Promise(async (resolve, reject) => {

      const data = {
        source: 'CAMPAIGN',
        sourceId: campaignId,
        deviceFingerprint: fingerprint,
        token: token,
        locationAndIpInfo: locationAndIpInfo
      }

      // console.log("data:" + JSON.stringify(data))
      if ('development' === process.env.NODE_ENV) {
        console.log(this.apiKey);
      }

      const baseUrl = process.env.REWARDS_API_URL;
      try {
        let response = await fetch( baseUrl + 'user_sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-api-key': this.apiKey!
          },
          body: JSON.stringify(data),
        });
        if ('development' === process.env.NODE_ENV) {
          console.log(response)
        }

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
      } catch (err) {
        reject (err);
      }
      
    });
   }
}
