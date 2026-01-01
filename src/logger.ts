import { pino } from "pino";
import { lokiSteam } from "./LokiStream.js";

const { LEVEL = "INFO" } = process.env;

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
  lokiSteam,
);
