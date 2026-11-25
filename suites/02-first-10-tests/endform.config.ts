import { defineEndformConfig } from "endform";

export default defineEndformConfig({
	// Lets the remote runners reach an app running on this machine, such as
	// BASE_URL=http://localhost:3000, through the Endform CLI.
	proxyNetworkHosts: ["<loopback>"],
	additionalFiles: [".intent/**/*.ts"],
});
