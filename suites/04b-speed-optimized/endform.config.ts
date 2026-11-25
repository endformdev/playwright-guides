import { defineEndformConfig } from "endform";

export default defineEndformConfig({
	// Lets the remote runners reach an app running on this machine, such as
	// BASE_URL=http://localhost:3000, through the Endform CLI.
	proxyNetworkHosts: ["<loopback>"],
	concurrentTestLimits: [
		// The payment provider only processes a couple of charges at a time.
		// Running more checkout tests than that at once only makes them queue,
		// so leave the extra runners for the rest of the suite.
		{ scope: "within-suite-run", label: "tag:@payments", limit: 2 },
	],
});
