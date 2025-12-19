import {
  type Context,
  type APIGatewayProxyResult,
  type APIGatewayProxyEventV2,
} from 'aws-lambda';
import { pino } from 'pino';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';

const { BASE_URL = '', ALL_PROXY = '', LOG_LEVEL = 'info' } = process.env;
const getMethods = new Set(['GET', 'HEAD']);
const log = pino({
  messageKey: 'message',
  level: LOG_LEVEL,
  formatters: {
    level: label => ({ level: label.toUpperCase() }),
  },
});

export const handler = async (
  event: APIGatewayProxyEventV2,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  const {
    body = null,
    headers,
    queryStringParameters,
    requestContext: {
      http: { method, path },
    },
  } = event;

  if (!URL.canParse(BASE_URL)) {
    return {
      statusCode: 500,
      body: 'Internal Server Error',
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

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
    };
  } catch (error) {
    log.error('Error occurred: %s', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
