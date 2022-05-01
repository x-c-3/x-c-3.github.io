// Fix headers if they have a fragment link
const allHeaders = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
allHeaders.forEach((header) => {
	if (header.innerHTML.startsWith("#")) {
		header.id = header.id.slice(1);
		header.innerHTML = header.innerHTML.replace(
			"#", `<a href="#${header.id}">#</a>`
		)
	}
});