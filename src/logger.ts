import { pino } from "pino";

const {
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
);
