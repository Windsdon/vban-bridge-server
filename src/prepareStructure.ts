import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const configBase = join(process.cwd(), "config");

const steps = [
	() => mkdirSync(configBase),
	() => {
		const configJson = join(configBase, "config.json");
		if (!existsSync(configJson)) {
			writeFileSync(
				configJson,
				JSON.stringify(
					{
						password: ""
					},
					null,
					"\t"
				)
			);
		}
	}
];

for (const step of steps) {
	try {
		step();
	} catch (e) {}
}
