import { Writable } from "node:stream";
import fetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";

const { ALL_PROXY = "" } = process.env;

type Labels = Record<string, string>;

async function dispatch(
  url: string,
  body: string,
) {
  return await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    agent: new SocksProxyAgent(ALL_PROXY),
  });
}

class LokiBufferStream extends Writable {
  #buffer: Array<[string, string]> = [];
  constructor(
    private readonly url: string,
    private readonly batchSize: number = 50,
    private readonly labels: Labels = {},
  ) {
    super({ objectMode: true });
  }

  _write(
    chunk: unknown,
    _: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    this.#buffer.push([`${Date.now() * 1e6}`, JSON.stringify(chunk)]);

    if (this.#buffer.length >= this.batchSize) {
      this.flush().finally(callback);
    } else {
      callback();
    }
  }

  async flush() {
    if (this.#buffer.length === 0) {
      return;
    }

    const logsToSend = this.#buffer;
    this.#buffer = [];

    const body = {
      streams: [
        {
          stream: this.labels,
          values: logsToSend,
        },
      ],
    };

    const response = await dispatch(
      this.url,
      JSON.stringify(
        body,
      ),
    );
    
    if (!response.ok) {
      this.#buffer.unshift(...logsToSend);
    }
  }

  _final(callback: (error?: Error | null) => void) {
    this.flush().finally(callback);
  }
}

function getLokiStream(url: string, labels: Labels) {
  return new Writable({
    objectMode: true,
    write(log, _, callback) {
      const body = {
        streams: [
          {
            stream: labels,
            values: [[`${Date.now() * 1e6}`, JSON.stringify(log)]],
          },
        ],
      };
      dispatch(url, JSON.stringify(body)).then(
        (response) => {
          if (!response.ok) {
            throw new Error(`Loki returned ${response.status}`);
          }
          callback();
        },
      ).catch((error) => {
        console.error("Failed to push to loki: ", error);
        callback(error);
      });
    },
  });
}

export function pinoLoki(
  options: { url: string; labels: Labels; batch?: boolean; batchSize?: number },
) {
  if (options.batch) {
    return new LokiBufferStream(options.url, options.batchSize, options.labels);
  }

  return getLokiStream(options.url, options.labels);
}
