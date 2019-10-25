import { readFileSync } from "fs";
import { join } from "path";

export class Config {
	static password: string = "";
}

const config = JSON.parse(readFileSync(join(process.cwd(), "config/config.json")).toString("utf8"));
Config.password = config.password;
