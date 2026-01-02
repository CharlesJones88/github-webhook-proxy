import {
  type APIGatewayProxyEventV2,
  type APIGatewayProxyResult,
  type Context,
} from "aws-lambda";
import fetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";
import { logger as parent } from "./logger.js";

const { BASE_URL = "", ALL_PROXY = "" } = process.env;
const getMethods = new Set(["GET", "HEAD"]);

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const logger = parent.child({
    awsRequestId: context.awsRequestId,
    functionName: context.functionName,
  });
  logger.info("Request received");
  const {
    body = null,
    headers,
    queryStringParameters,
    requestContext: {
      http: { method, path },
    },
  } = event;

  if (!URL.canParse(BASE_URL)) {
    logger.error("Invalid url: %s", BASE_URL);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }

  const url = new URL(path, BASE_URL);
  if (queryStringParameters != undefined) {
    for (const [key, value] of Object.entries(queryStringParameters)) {
      value != undefined && url.searchParams.set(key, value);
    }
  }

  try {
    // Remove host header to ensure routing works
    delete headers.host;
    const response = await fetch(url, {
      method,
      headers: headers as Record<string, string>,
      body: getMethods.has(method) ? null : body,
      agent: new SocksProxyAgent(ALL_PROXY),
    });

    logger.info(
      {
        ok: response.ok,
        status: response.status,
      },
      "Request finished with: %d ms remaining",
      context.getRemainingTimeInMillis(),
    );
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
    };
  } catch (error) {
    logger.error({ error }, "An unknown error occurred");
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
