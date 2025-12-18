FROM public.ecr.aws/lambda/nodejs:24 AS builder

WORKDIR /var/task

COPY package.json package-lock.json ./
RUN npm ci

FROM public.ecr.aws/lambda/nodejs:24

WORKDIR /var/task

COPY tailscale_bootstrap /var/runtime
COPY --from=builder /var/task/node_modules ./node_modules
COPY dist/index.js ./
COPY --from=docker.io/tailscale/tailscale:stable /usr/local/bin/tailscaled /var/runtime/tailscaled
COPY --from=docker.io/tailscale/tailscale:stable /usr/local/bin/tailscale /var/runtime/tailscale
RUN mkdir -p /var/run && ln -s /tmp/tailscale /var/run/tailscale && \
    mkdir -p /var/cache && ln -s /tmp/tailscale /var/cache/tailscale && \
    mkdir -p /var/lib && ln -s /tmp/tailscale /var/lib/tailscale && \
    mkdir -p /var/task && ln -s /tmp/tailscale /var/task/tailscale

ENTRYPOINT [ "/var/runtime/tailscale_bootstrap" ]
CMD [ "index.handler" ]
