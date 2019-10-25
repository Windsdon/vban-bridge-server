import { readFileSync } from "fs";
import { join } from "path";
import * as tls from "tls";
import { TlsOptions, TLSSocket } from "tls";
import ClientManager from "./ClientManager";

const STREAM_TIMEOUT = 5000;
const timeouts: Map<string, NodeJS.Timeout> = new Map();

const clients = new Set<TLSSocket>();

const options = {
	key: readFileSync(join(process.cwd(), "config/server.key")),
	cert: readFileSync(join(process.cwd(), "config/server.crt")),
	requestCert: true,
	rejectUnauthorized: false
} as TlsOptions;

const server = tls.createServer(options, async socket => {
	const cert = socket.getPeerCertificate();
	const fingerprint = cert.fingerprint.toUpperCase();
	console.log(`Client with ID ${fingerprint} connected`);

	socket.on("error", err => {
		socket.removeAllListeners();
		console.log(`Client connection ${fingerprint} error: ${err.message}`);
	});

	socket.on("end", () => {
		clients.delete(socket);
	});

	const accepted = await ClientManager.instance.accept(socket);

	if (!accepted) {
		console.log(`Kill connection`);
		socket.end();
		return;
	}

	socket.write(Buffer.from([0x03]));

	clients.add(socket);

	socket.on("data", (data: Buffer) => {
		if (!clients.has(socket)) {
			return;
		}

		const packetType = data.readUInt8(0);

		if (packetType === 0xff) {
			const vbanData = data.slice(1);
			processVban(vbanData, fingerprint);
			for (const client of clients) {
				try {
					client.write(data);
				} catch (e) {}
			}
		}
	});
});

const PORT = process.env.PORT || 8989;

server.listen(PORT, () => {
	console.log(`server bound on port ${PORT}`);
});

function bufferToString(buffer: Buffer) {
	const firstNull = buffer.indexOf(0);
	if (firstNull === -1) {
		return buffer.toString("utf8").trim();
	}

	return buffer
		.slice(0, firstNull)
		.toString("utf8")
		.trim();
}

function processVban(msg: Buffer, fingerprint: string) {
	const nameBuffer = Buffer.alloc(16);
	msg.copy(nameBuffer, 0, 8);
	const name = bufferToString(nameBuffer);
	const key = `${fingerprint}/${name}`;

	const endHandler = () => {
		console.log(`-  Stop: ${key}`);
		timeouts.delete(key);
	};

	if (!timeouts.get(key)) {
		console.log(`+ Start: ${key}`);
	} else {
		clearTimeout(timeouts.get(key)!);
	}

	timeouts.set(key, setTimeout(endHandler, STREAM_TIMEOUT));
}
