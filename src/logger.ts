import { pino } from "pino";
import { pinoLoki } from "./LokiStream.js";

const {
  BASE_URL = "",
  ENDPOINT = "",
  LEVEL = "INFO",
} = process.env;

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
    url: `${BASE_URL}${ENDPOINT}`,
    labels: { service: process.env.AWS_LAMBDA_FUNCTION_NAME },
    batch: true,
  }),
);
