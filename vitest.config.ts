import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globalSetup: ["setupVitest.ts"],
		typecheck: {
			enabled: true,
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"node_modules/",
				"dist/",
				"**/*.test.ts",
				"setupVitest.ts",
			],
		},
	},
});
