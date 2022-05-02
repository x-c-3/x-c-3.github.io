const contentHeaders = document.querySelectorAll(".content h1, .content h2, .content h3, .content h4, .content h5, .content h6");

contentHeaders.forEach((header) => {

	// Adding fragment to header
	header.innerHTML = `<a href="#${header.id}">#</a> ${header.innerHTML}`

	// Adding fragment to sidebar
	sidebarElement = document.createElement("a");
	sidebarElement.href = `#${header.id}`;
	sidebarElement.innerHTML = `. <span style="color:var(--white-${header.tagName[1]})">${header.innerText}</span>`.replace(
		"#", '<span style="color:orange;">#</span>'
	).replace(
		".", `<span style="color:dimgrey;">${" ".repeat(header.tagName[1])}.</span>`
	);
	$(".sidebar > .sidebar-content")[0].appendChild(sidebarElement);
});