import { pino } from "pino";
import { pinoLoki } from "pino-loki";

const { BASE_URL = "", LEVEL = "INFO" } = process.env;

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
    host: `${BASE_URL}/loki`,
    labels: {
      service: "github-webhook-proxy",
    },
  }),
);
