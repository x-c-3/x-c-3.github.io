---
layout: post
title:  "based"
author: "FLCTF (me)"
date:   2022-05-27 15:00:00 +0000
categories: ctf flctf web
description: "a contrived solution to a contrived problem"
---

*Challenge link not shared, sorry!*

This is my writeup of my own challenge from my own mini-CTF that I hosted at my school, intended to be primarily a documentation-reading challenge. This should be a free flag for any participants. I won't be directly providing the flag, but following all the steps listed below will yield the flag hopefully :)

---  

# Intro

> the path to being based is a dangerous one, but in this world, it's base or be based.
>
> /home/ctf/flag

Clicking on the website reveals a paragraph of text as shown below:  

> welcome young padawan. i congratulate you on beginning your path to being based.
>
> we here thrive as a community, so all of our webpages are built by members of the community. if you want to contribute, you can submit a new page here. (link to upload page)
>
> otherwise, you can check out some of the community webpages below. we use base64 to encode all of our pages for storage on the server and os.path.join for joining filepaths so you needn't worry about any path traversal attacks. traverse lightly friend.

This is seemingly a file-hosting website where we can upload files. These files are then stored on the server somewhere, and then we can read them by clicking on the links below the text. But before we try to break anything, let's try and understand what the aforementioned "path traversal attack" that it's protected against is.

---

# Exploitation

## Path Traversal

If you have a Windows machine, try going into your command prompt (`cmd.exe`) and entering the command `dir`. If you're on Linux, enter `ls -a` instead. What do you see?  

It's a list of the contents of your current directory, which may include regular files, other directories, hidden files, etc. However, look at the top of the output of that command. Do you see those weird directories at the top, `.` and `..`?

```
C:\Users\harry>dir
 Volume in drive C is C:
 Volume Serial Number is 00XX-XXXX

 Directory of C:\Users\harry

26/05/2022  15:18    <DIR>          .
16/01/2022  15:27    <DIR>          ..
14/02/2022  01:23    <DIR>          .atom
10/02/2022  18:56    <DIR>          .aws
10/02/2022  18:56    <DIR>          .azure
10/02/2022  22:04                61 .bash_history
10/02/2022  22:17    <DIR>          .bundle
19/03/2022  01:50    <DIR>          .config
16/02/2022  22:46    <DIR>          .docker
30/04/2022  12:45    <DIR>          .ghidra
24/02/2022  21:59               378 .gitconfig
28/12/2021  20:53    <DIR>          .gradle
```

Those actually refer to the current directory and the parent directories respectively! Indeed, the path `/my/path/goes/here/` is actually equivalent to the path `/my/path/goes/goes/here/.` - the dot refers to the directory itself, so it goes nowhere. In the same way, `/my/path/goes/here/` is also equivalent to `/my/path/goes/here/too/..` - the double dot goes back a directory, which undoes the traversal into directory `too`.  

Additionally, note the leading slash on all of these paths - this is known as an **absolute path**, which means that this path is relative to the root of the filesystem. We'll come back to this in a bit.  

It might help to think of the filesystem as a multi-storey building, with the root being the ground floor (assuming there's no underground floor). A relative path - one without a leading slash, such as `abc/def/ghi` - is equivalent to saying "go up three floors via the staircase from the floor you're currently on", whereas an absolute path such as `/abs/path` is like saying "take the elevator up two floors from the ground floor".  

So how does this all link into a vulnerability? Well, if the files are just stored on the server and the server is using the user input as the filename of the file, maybe we could ask for files outside of the directory we're in, such as `../../../../../../../../../../etc/passwd`, or `../app.py` to leak the source code. This is known as a **local file inclusion** vulnerability, and if the app's vulnerable to that, we could get the flag which is in `/home/ctf/flag` by just supplying the file we want to read as `../../../../../../../../../../home/ctf/flag` (relative) or `/home/ctf/flag` (absolute)! However, in practice, you just get a 404 Not Found error. So what's the problem?  

Well, as hinted at by the text on the page, our filenames are being base64 encoded.

## Base64

Base64 is just another type of encoding, like hexadecimal (base16), binary (base2) or even decimal (base10) - it's just a way of representing data! The number denotes the number of different symbols used to represent this data, and you can find many tools online to encode data into base64 encoding and decode it from base64 encoding. Here, I'll be using Python's `base64` library, as it is the same as what is used in the challenge (from the description).  

Let's see what happens when we try and base64 encode our path traversal payloads:  

```py
>>> import base64
>>> base64.b64encode(b"../../../../../home/ctf/flag")
b'Li4vLi4vLi4vLi4vLi4vaG9tZS9jdGYvZmxhZw=='
>>> base64.b64encode(b"/home/ctf/flag")
b'L2hvbWUvY3RmL2ZsYWc='
```

They become these long encoded strings, and in particular they lose all of our path-traversing special characters, `.` and `/`, hence why they aren't working. But who says that they can't have special characters?  

Checking out the Python documentation for base64 encoding (linked on the challenge) yields this:

> base64.b64encode(s, altchars=None)
> Encode the bytes-like object s using Base64 and return the encoded bytes.
> 
> Optional altchars must be a bytes-like object of at least length 2 (additional characters are ignored) which specifies an **alternative alphabet for the + and / characters. This allows an application to e.g. generate URL or filesystem safe Base64 strings. The default is None, for which the standard Base64 alphabet is used**.

By default, the base64 alphabet includes the slash character, which can be used for an absolute path traversal! *(- small footnote, part of the challenge was reading the [os.path.join](https://docs.python.org/3/library/os.path.html#os.path.join) documentation to realise that this was possible, as when absolute paths are passed to this function, it drops all previous paths that are joined, but the article is already so long as is)* If we managed to provide an input such that its base64 equivalent was `/home/ctf/flag`, we would be able to access that file and retrieve the flag. So, decoding `/home/ctf/flag` from base64 in Python yields...

```py
>>> base64.b64decode("/home/ctf/flag")
Traceback (most recent call last):
  File "<pyshell#5>", line 1, in <module>
    base64.b64decode("/home/ctf/flag")
  File "C:\Program Files\WindowsApps\PythonSoftwareFoundation.Python.3.9_3.9.3568.0_x64__qbz5n2kfra8p0\lib\base64.py", line 87, in b64decode
    return binascii.a2b_base64(s)
binascii.Error: Incorrect padding
```

...an incorrect padding error. Reading about the documentation for base64, base64 strings always have to be a multiple of 4 characters long, which `/home/ctf/flag` isn't, and if they aren't a multiple of 4 characters long, they have to be padded to that length with equals signs. So, `/home/ctf/flag` would become `/home/ctf/flag==`, which wouldn't be the file we want. How can we overcome this?  

Well, with some testing, you might find that most system path parsers actually treat a multiple slashes in the middle of a path as a single slash! So, `/home/ctf/flag` is actually just equivalent to `/home/ctf///flag`, which is a multiple of 4 characters long and hence does not need to be padded:

```py
>>> base64.b64decode("/home/ctf///flag")
b'\xfe\x1a&{\xf7-\x7f\xff\xff~V\xa0'
```

Therefore, if we supplied these bytes as the filename we want to view, the server would first base64 encode these bytes, yielding `/home/ctf///flag`, then it would retrieve the file from that location - our flag!  

There is one final step, which is actually sending this request. Do to this, inspect tools are your best friend - try clicking on one of the links to view one of the normal pages with the network tab on inspect tools open, then right click the request and "copy as fetch". You should get something that looks a bit like:

```js
fetch("http://freeloadingctf.sytes.net:9010/page", {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded",
    "pragma": "no-cache",
    "upgrade-insecure-requests": "1"
  },
  "referrer": "http://freeloadingctf.sytes.net:9010/",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": "page=Schoolshed.html",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```

`fetch` is a JavaScript API to make HTTP requests programmatically, which you can then use to programmatically alter and send a HTTP request with your payload by using the console in your inspect tools. Take care for special characters in your payload (the "&" character is a delimiter for different key-value pairs in your body, so make sure to url-encode that), but then you will get the flag! :)
