export interface UserProfile {
    emailAddress: string,
    givenName?: string,
    familyName?: string;
    telephoneNumber?: string;
    extraFields?: { [key: string]: any };
}