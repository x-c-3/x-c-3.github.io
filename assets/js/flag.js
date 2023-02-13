// :)
(()=>{
	var flags = ["D:"];
	flag = `${flags[Math.floor(Math.random() * flags.length)]}`;
	$(".article-title")[0].innerText = flag;
	document.title = `x-c-3 | ${flag}`;
})();