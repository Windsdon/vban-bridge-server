import { TLSSocket } from "tls";
import { createHmac, randomBytes } from "crypto";
import { Config } from "./Config";

export default class AuthorizationProcess {
	private readonly socket: TLSSocket;
	constructor(socket: TLSSocket) {
		this.socket = socket;
	}

	async authorize(): Promise<boolean> {
		const rand = randomBytes(16);
		const expected = createHmac("sha256", Buffer.from(Config.password))
			.update(rand)
			.digest();

		this.socket.write(Buffer.from([0x01, ...rand.values()]));

		return new Promise<any>((resolve, reject) => {
			this.socket.once("data", (data: Buffer) => {
				console.log(data);
				const packetType = data.readUInt8(0);

				if (packetType !== 0x02) {
					console.log(`Invalid packet type: ${packetType}. Expecting 0x02.`);
					return resolve(false);
				}

				console.log(`Expected:`, expected);
				if (expected.length !== data.length - 1) {
					console.log(`Invalid packet length`);
					return resolve(false);
				}

				resolve(expected.compare(data, 1) === 0);
			});
		});
	}
}
