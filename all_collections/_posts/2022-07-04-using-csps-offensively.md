---
layout: post
title:  "Using CSPs offensively"
author: "me"
date:   2022-07-04 15:00:00 +0000
categories: research csp web
description: "you are such a csp :("
---

*This article is being actively updated with new information. If you think I've missed something out or made a horrible mistake (which I probably have), then please email me at [3cx.xc3@gmail.com](mailto:3cx.xc3@gmail.com?subject=you%20have%20made%20a%20horrible%20mistake)*

While brainstorming challenge ideas following the goldmine of rabbit holes that was Google CTF 2022, the notion of an attacker-oriented CSP caught my attention. I couldn't find many articles online documenting the applications of CSP from the attacker's perpsective, so here are some uses that I've thought of and corroborated with online evidence. These may not have many real-world practical applications (other than CTFs) but I do hope that you'll still find them interesting.  

All interactions are tested on **Chrome 103.0.5060.66**, which is the latest stable release of Chrome as of 4th July 2022.  

Please enjoy!

---  

# <iframe csp>

## Premise

*This feature is likely to change in the future. Please check if this still applies!*

The `csp` attribute on iframes is an experimental feature that allows one to ensure that a CSP is present on an embedded page. From [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox), "A Content Security Policy enforced for the embedded resource."  

What this means is that if you embed a page that has a CSP that is less restrictive that the one you have specified in the `csp` attribute on your iframe, then **your browser will not display it**. For example, a page with this CSP header:

```
Content-Security-Policy: default-src 'self';
```

embedded in an iframe with a `csp` attribute as below:

```html
<iframe src="site" csp="default-src 'none';"></iframe>
```

won't load, because the page doesn't respond with a CSP header as restrictive as the `csp` attribute has specified. When used as intended, this could prevent a rogue frame from executing malicious JS code.

## XS-Leak with Gadgets

*If you don't know what an XS-Leak is, check out [xsleaks.dev](https://xsleaks.dev/).*

This behaviour alone does not leak enough side-channel information for a successful XS-Leak. There has been a report of a since-fixed bug where this behaviour has leaked excessive information on the embedding document through a misimplemented API, shown [here](https://bugs.chromium.org/p/chromium/issues/detail?id=1105875), but ignoring this, there should be no event listeners, CSS styles, etc. on the embedding document that can distinguish between a blocked page and an unblocked page. Though, if you think that you've found a way in which you can distinguish between the two, then you're likely to be eligible for a bounty, as the researcher was on the linked report. :)  

The key idea is that although it isn't possible for this behaviour to act as a cross-site oracle by itself, **when used in conjunction with known methods on gadgets, it could enable the leakage of side-channel information in a scenario where it would have previously been impossible to**.  

I'll be using the term "gadget" to refer to some quantity that we can measure cross-site, but changes differently depending on the value of the `csp` attribute of the iframe it is embedded in.  

---

Consider a situation in which you know there exists an admin endpoint where you can query for existing users by the start of their username, eg the query `abc` would match all users with the usernames `abc`, `abcer`, `abcabacus` etc. and if a match is found, the admin is navigated to the first matching user's profile page, and if not, they are navigated to a simple "No results" error page. It could be that these two pages have different CSPs, which would not be unlikely given a variety of different scenarios: for example, the user page may be more heavily restricted than the error page due to the increased density of possible malicious HTML injection sinks; or the error page may have an extremely restrictive CSP by default, as is common with many frameworks, including Express.js.  

Assuming the same response status code for both pages, with a negligible difference in load times, both pages with the response header `Cache-Control: no-store`, with the same number of iframes in both, etc. it can be hard to infer any information from side-channels. However, by having the page be embedded in an iframe with `csp` attribute such that one of the pages loads normally, whilst the other is blocked, it could be that differences are now detectable, so long as there is a *CSP XS-Leak gadget* present (i.e a measurable thing that changes depending on `csp`): for example, when a page is blocked, the iframes on that page are removed and hence the `window.length` property of that page changes to `0`. Therefore, if the two resultant pages previously had the same non-zero number of iframes, this technique could be used to distinguish between the two pages and hence enable an XS-Leak.  

The consequences here would be the exposure of usernames on a server, which isn't a terribly large deal, but consequences would scale with the scenario and whatever's at stake.  

---

Scary? Not really. This attack really only applies if the only blatant difference between two pages is the CSP, which is almost certainly a coincidence and not a defence as the obvious, easier and more effective mitigation is to simply add an `X-Frame-Options: DENY` header to the server to prevent the page from being embedded in an iframe in the first place!  

In other words, this attack is sort of like a "win more" card in a trading card game: it doesn't help if they have the normal defences, but in the case that they don't, there's an off-chance that it might help you.  

In some other words, it's a CTF challenge.  

However, if there is ever a similar feature implemented with `window.open`, this sort of technique could be more impactful. And also mitigated with the `Cross-Origin-Opener-Policy`. There is a bit of care to be taken here.