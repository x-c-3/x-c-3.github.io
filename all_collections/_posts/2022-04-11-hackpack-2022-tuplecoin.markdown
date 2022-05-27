---
layout: post
title:  "TupleCoin"
author: "HackPack"
date:   2022-04-11 14:26:00 +0000
categories: ctf hackpack web
description: "steam"
---

*[Challenge](https://tuplecoin.cha.hackpack.club)*  

**TL;DR**: The flag is revealed when TupleCoins are successfully withdrawn from Tuco's account, and normally, the player is not allowed to withdraw TupleCoins from this account. To ensure that users cannot arbitrarily modify transactions, details of any transactions are hashed with a secret. However, as the details are concatenated end-on-end, one can send a specially crafted request that has the same hash as a valid request but actually withdraws TupleCoins from Tuco's account.  

---  

## Inititation

> TupleCoin is launching their eponymous cryptocurrency today, and their flamboyant and capricious CEO is challenging you to bring home a bug bounty. Can you crack the crypto?!

Initially testing, it can be noted that you can't make an account with account number 314159265 (Tuco's account number) and that you can't withdraw money from Tuco's account, even through bypassing the dropdown box via a fetch command. Indeed, sending this request:  

```js
fetch("https://tuplecoin.cha.hackpack.club/api/transaction/certify", {
  "headers": {
    "content-type": "application/json"
  },
  "body": "{\"from_acct\":314159265,\"to_acct\":1,\"num_tuco\":5252522}",
  "method": "POST",
  "mode": "cors"
});
```  

...yields this response:  

```json
HTTP/1.1 400 Bad Request
Content-Length: 63
Content-Type: application/json
Date: Mon, 11 Apr 2022 13:49:06 GMT
Server: uvicorn

{"detail":"Ha! You think you can steal from Tuco so easily?!!"}
```  

...and making the same request to the `commit` endpoint requires a signature, which we don't know how to generate currently. However, making any other account and transferring any amount of money from that account - even to Tuco's account - does not yield an error, and appears to be perfectly valid. Checking out the Bug Bounty page hints us to lean towards `robots.txt`, which reveals 2 hidden endpoints: `/docs` and `/app/bkups`, the latter revealing the source and the former revealing some important API endpoints that we can work with.  

---  

## Exploitation

The solution to this problem is actually incredibly similar to the one in this [very interesting video](https://www.youtube.com/watch?v=4D-6nWIRZLU), which explores this same type of vulnerability in Steam to generate infinite funds!  

The crux of the problem is in these functions:  

```py
# bkups
def serialize(self) -> bytes:
    return (str(self.from_acct) + str(self.to_acct) + str(self.num_tuco)).encode()

def sign(self, secret_key: bytes) -> AuthenticatedTransaction:
    tuco_smash = self.serialize()
    tuco_hash = hmac.new(secret_key, tuco_smash, "sha256").hexdigest()
    
    return CertifiedTransaction.parse_obj({
        "transaction": {
            "from_acct": self.from_acct,
            "to_acct": self.to_acct,
            "num_tuco": self.num_tuco
        },
        "auth_tag": tuco_hash,
    })
```  

The way that the server verifies that the transactions haven't been tampered with at the `commit` endpoint is by smooshing together all the details (stored in `tuco_smash`), then generating a SHA256 hash of that (stored in `tuco_hash`). Usually, this would probably not be an issue, but the way they're putting together all the details is actually a massive problem. Consider these two scenarios:  

from_acct: <span style="color:yellow">31415926</span>  
to_acct: <span style="color:red">54321</span> (any number that begins with a 5 and 2nd digit non-zero)  
num_tuco: <span style="color:green">111</span> (irrelevant)  

By the `serialize()` function, all of these values would be concatenated to get the value that will be hashed, which would look like this: <span style="color:yellow">31415926</span><span style="color:red">54321</span><span style="color:green">111</span>. And, if we sent a request to the `certify` endpoint with these values, the server would interpret it as it is: a transaction from an account that **is not Tuco's**, and hence generate a signature for it:  

```json
{
  "transaction": {
    "from_acct": 31415926,
    "to_acct": 54321,
    "num_tuco": 111
  },
  "auth_tag": "a30a35af3a3ee0c90bb284cbfe78bac125c6aed9a70e3cc6f842ace22cb99287"
}
```  

...so all is good, until you consider this alternative scenario:  

from_acct: <span style="color:yellow">314159265</span> (Tuco's account number)  
to_acct: <span style="color:red">4321</span> (minus the 5 at the start)  
num_tuco: <span style="color:green">111</span> (same as before)  

Let's compare the values to be hashed:  

<span style="color:yellow">31415926</span><span style="color:red">54321</span><span style="color:green">111</span> (first one)  
<span style="color:yellow">314159265</span><span style="color:red">4321</span><span style="color:green">111</span> (second one)  

They are the exact same, and as they are being hashed with the same secret, they would generate the same hash! Now it doesn't matter that we can't directly get a signature for this transaction due to it being from Tuco's account, as we know that it will generate the same one as before. Therefore, we can just send a request to the `commit` endpoint with our doctored values and pre-verified signature, and we're good to go!  

```
Flag: flag{th3r3_r_2_k1nds_0f_crypt0_n_7h3_w0r1d___th15_15nt_1_0f_th3m}
```
