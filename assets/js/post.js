const allHeaders = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
fragmentedHeaders = [];

// Adding fragments to all headers starting with "#""
allHeaders.forEach((header) => {
	if (header.innerHTML.startsWith("#")) {
		header.id = header.id.slice(1);
		header.innerHTML = header.innerHTML.replace(
			"#", `<a href="#${header.id}">#</a>`
		)
		fragmentedHeaders.push(header);
	}
});

// Adding fragmented headers to sidebar
fragmentedHeaders.forEach((header) => {
	sidebarElement = document.createElement("a");
	sidebarElement.href = `#${header.id}`;
	sidebarElement.innerHTML = `. ${header.innerText}`.replace(
		"#", '<span style="color:orange;">#</span>'
	).replace(
		".", '<span style="color:dimgrey;">.</span>'
	);
	$(".sidebar > .sidebar-content")[0].appendChild(sidebarElement);
});