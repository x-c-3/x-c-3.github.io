// :)
(()=>{
	var flags = ["n07_f0und", "uh_0h", "n0_c1g4r", "unf0r7un473", "r4m_requ1r3d", ":(", "m1553d_4_s3m1c0l0n", "n07_g00d", "*******", "pl4y_s3m4n7l3", "w38_br0k3", "R1P", "s4d", "3m41l_m3", "m3554g3_m3", "00ps", "m1574k3", "pr08a8ly_84d", "NUL", "CTRL", "7ry_55t1", "7ry_55rf", "7ry_x55", "7ry_5d70", "7ry_h4x", "g3t_g00d", "7ry_w38", "7ry_cryp70", "m1n3_cryp70", "5yn74x_3rr0r", "d474_3rr0r", "1n7_0v3rfl0w", "5t4ck_5m45h3d", "5tr1ng5_f0rm4773d", "pwn3d", "5cr1p73d", "f4k3_fl4g", "r34l_fl4g"];
	flag = `CTF{${flags[Math.floor(Math.random() * flags.length)]}}`;
	$(".article-title")[0].innerText = flag;
	document.title = `x-c-3 | ${flag}`;
})();
