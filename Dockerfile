ARG ARCH=amd64

FROM arm64v8/node:22-slim AS base-arm64
FROM amd64/node:22-slim AS base-amd64

FROM base-${ARCH}
ARG ARCH

RUN apt-get update \
    && apt-get install --no-install-recommends -y wget unzip fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros \
        fonts-kacst fonts-freefont-ttf libxss1 dbus dbus-x11 \
    && service dbus start \
    && groupadd -r bot \
    && useradd -rm -g bot -G audio,video bot

RUN apt-get install --no-install-recommends --yes ca-certificates fonts-liberation gconf-service libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libdrm2 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
    libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
    libxfixes3 libxi6 libxrandr2 libxrender1 libxshmfence1 libxss1 libxtst6 lsb-release wget xdg-utils

RUN if [ "${ARCH}" = "amd64" ]; then \
        suffix=""; \
    else \
        suffix="-${ARCH}"; \
    fi; \
    wget -q --show-progress "https://playwright.azureedge.net/builds/chromium/1129/chromium-linux${suffix}.zip" -O chromium-linux.zip
RUN unzip chromium-linux.zip
RUN rm -f ./chromium-linux.zip

ENV DBUS_SESSION_BUS_ADDRESS=autolaunch:
ENV XDG_CONFIG_HOME=/home/bot/.config
ENV XDG_CACHE_HOME=/home/bot/.cache
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_PATH=/chrome-linux/chrome
ENV PUPPETEER_EXECUTABLE_PATH=/chrome-linux/chrome

USER bot

WORKDIR /home/bot

RUN mkdir .config
RUN mkdir .cache

COPY package.json tsconfig.json ./
RUN npm i

COPY config ./config
COPY src ./src
RUN npx tsc

COPY assets ./assets
COPY quirky-responses.txt prompts.json ./

ENTRYPOINT node -r dotenv/config /home/bot/bin/index.js
