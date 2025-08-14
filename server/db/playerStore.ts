import fs from 'fs'; 

// Replaced with DB eventually but its proof of concept
// sets the new player in the db with the newly assigned cookie
export function setPlayerCookie(cookie: any) {
    const jsonPath = "../db/players.json"; 
    const db = JSON.parse(fs.readFileSync(jsonPath));

    const newUser = {
        userCookie: cookie
    }; 
    db.players.push(newUser); 
    fs.writeFileSync(jsonPath, db, 'utf-8'); 
}

// if the cookie is expired, take the one from local storage, and replace it. 
export function replacePlayerCookie(oldCookie: any, newCookie: any) {

}