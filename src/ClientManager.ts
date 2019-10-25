import { TLSSocket } from "tls";
import { existsSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import AuthorizationProcess from "./AuthorizationProcess";

export default class ClientManager {
	private authorizedClients: Set<string>;
	private configFilePath: string;

	private constructor() {
		this.configFilePath = join(process.cwd(), "config/authorized.txt");
		if (!existsSync(this.configFilePath)) {
			writeFileSync(this.configFilePath, "");
		}
		const authorizedText = readFileSync(this.configFilePath).toString();
		const list = authorizedText
			.split("\n")
			.map(u => u.trim().toUpperCase())
			.filter(u => u && u.length > 0);

		this.authorizedClients = new Set(list);
	}

	async accept(socket: TLSSocket) {
		const fingerprint = socket.getPeerCertificate().fingerprint.toUpperCase();
		if (this.authorizedClients.has(fingerprint)) {
			return true;
		}

		const authorized = await new AuthorizationProcess(socket).authorize();

		console.log(`Authorization: ${fingerprint}: ${authorized}`);

		if (authorized) {
			this.authorizedClients.add(fingerprint);
			await this.saveList();
		}

		return authorized;
	}

	private static _instance: ClientManager | undefined;

	static get instance(): ClientManager {
		ClientManager._instance = ClientManager._instance || new ClientManager();
		return ClientManager._instance;
	}

	private async saveList() {
		writeFileSync(this.configFilePath, [...this.authorizedClients.values()].join("\n"));
	}
}
