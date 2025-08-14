import {v4 as uuidv4} from 'uuid'; 
/**
 * Retrieves the users player login cookie or creates one upon connection.
 * @param cookie - The connected users cookie or null. 
 * @returns - An object representing the cookie and if it needs to be replaced. 
 */
export function retrieveCookie(cookie: any) {
    if (cookie) {
        // I have to actually parse this cookie and look for the userIDCookie
        // If the cookie isnt expired
        return { cookie: false }; 
        // if the cookie is expired. 
        // return { uuidv4(): true }; 
    } else {
        let newCookie = uuidv4(); 
        return { cookie: false }; 
    }
}

// Ideally replace this with a user given, username. 
export const genId = () => {
  return Math.floor(Math.random() * 1000);
}