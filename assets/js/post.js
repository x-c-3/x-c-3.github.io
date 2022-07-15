const contentHeaders = document.querySelectorAll(".content h1, .content h2, .content h3, .content h4, .content h5, .content h6");

contentHeaders.forEach(header => {

	// Adding fragment to sidebar
	sidebarElement = document.createElement("li");
	sidebarElement.innerHTML = `<a href="#${header.id}"><span style="color:var(--white-${header.tagName[1]})">${header.innerText.replace("<", "&lt;")}</span></a>`;
		// .replace(
		// 	"#", '<span style="color:orange;">#</span>'
		// );
		// .replace(
		// 	".", `<span style="color:dimgrey;">${" ".repeat(header.tagName[1])}.</span>`
		// )
	$(".sidebar > .sidebar-content > .sidebar-list")[0].appendChild(sidebarElement);

	// Adding fragment to header
	header.innerHTML = `<a href="#${header.id}" style="font-weight: bold; font-style: normal;">#</a> ${header.innerHTML}`

});