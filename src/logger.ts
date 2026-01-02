import { pino } from "pino";
import { pinoLoki } from "./LokiStream.js";

const { BASE_URL = "", LEVEL = "INFO" } = process.env;
const lokiEndpoint = "loki/api/v1/push";

export const logger = pino(
  {
    level: LEVEL,
    messageKey: "message",
    formatters: {
      level(label) {
        return {
          level: label.toUpperCase(),
        };
      },
    },
  },
  pinoLoki({
    url: `${BASE_URL}/loki/${lokiEndpoint}`,
    labels: { service: "github-webhook-proxy" },
    batch: true,
  }),
);
