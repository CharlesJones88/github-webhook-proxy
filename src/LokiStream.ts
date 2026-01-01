import { Writable } from "node:stream";
import fetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";

const { ALL_PROXY = "", BASE_URL = "" } = process.env;

export const lokiSteam = new Writable({
  objectMode: true,
  write(log, _, callback) {
    const body = {
      streams: [
        {
          stream: { service: "github-webhook-proxy" },
          values: [[`${Date.now() * 1e6}`, JSON.stringify(log)]],
        },
      ],
    };

    fetch(`${BASE_URL}/loki/api/v1/push`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      agent: new SocksProxyAgent(ALL_PROXY),
    }).then(() => callback()).catch(callback);
  },
});