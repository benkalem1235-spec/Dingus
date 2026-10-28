FROM docker.io/library/debian:trixie-slim AS events
RUN apt-get update && apt-get install -y --no-install-recommends g++ g++-multilib make cmake git ca-certificates && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip && rm -rf /var/lib/apt/lists/*
ARG METAMOD_REV=6bfb29405219f1325134a5e44feffb9580ff3b5f
WORKDIR /build
RUN git init headers && cd headers && git remote add origin https://github.com/FWGS/metamod-fwgs.git && git fetch --depth 1 origin "$METAMOD_REV" && git checkout FETCH_HEAD
COPY events/headcrabs.cpp events/economy.hpp ./
RUN g++ -m32 -shared -fPIC -std=c++17 -D_LINUX -DLINUX -DPOSIX -Iheaders/metamod/include/engine -Iheaders/metamod/include/common -Iheaders/metamod/include/dlls -Iheaders/metamod/include/pm_shared -Iheaders/metamod/include/public -Iheaders/metamod/src headcrabs.cpp -o dingus_events.so
ARG METAMOD_SHA256=797d53cdced518e3ecd517012ce58e5a971e45e31203eefcaaedca4769bff389
RUN curl -fsSL https://github.com/FWGS/metamod-fwgs/releases/download/continuous/metamod-fwgs_linux_x86.zip -o metamod.zip && echo "$METAMOD_SHA256  metamod.zip" | sha256sum -c - && unzip -q metamod.zip -d package

# Servidor dedicado de CS 1.6: Xash3D FWGS + ReGameDLL_CS + bots YaPB (todo open source).
# Los archivos del juego (mapas, modelos, sonidos) se montan en /juego (solo lectura).
# Cada sala de config/salas.conf es un proceso aparte (ver entrypoint.sh).

# ---- 1. Bajar los binarios oficiales (Linux 32 bits) ----------------------------
FROM --platform=linux/amd64 debian:trixie-slim AS descarga
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl binutils && rm -rf /var/lib/apt/lists/*
# Versiones probadas (ver FUENTES.txt). Si los "continuous" ya cambiaron, se usa la
# versión nueva igual y se avisa en el armado.
ARG XASH_URL=https://github.com/FWGS/xash3d-fwgs/releases/download/continuous/xash3d-fwgs-linux-i386.tar.gz
ARG XASH_SHA256=5d5ea74081df5652e6f3759744884ac165967caf52a5776fe54ae38cec426d8a
ARG CS_URL=https://github.com/Velaron/cs16-client/releases/download/continuous/CS16Client-Linux-i386.tar.gz
ARG CS_SHA256=d607ced2471ace29003cfdaa8ec7e37b4b2bdd156ff245826b641fe3066b1d75
WORKDIR /tmp/dl
COPY preparar-motor.sh ./
RUN sh preparar-motor.sh

# ---- 2. Imagen final ------------------------------------------------------------
# Debian 13 (glibc 2.41) con las bibliotecas de 32 bits: ReGameDLL y YaPB piden
# glibc 2.38 o más nueva. El servidor es de 32 bits; en una Mac con chip M corre emulado.
FROM --platform=linux/amd64 debian:trixie-slim
RUN dpkg --add-architecture i386 && apt-get update && apt-get install -y --no-install-recommends libc6:i386 libstdc++6:i386 libgcc-s1:i386 unzip && rm -rf /var/lib/apt/lists/* && useradd --uid 10001 --create-home --home-dir /home/xash xash
COPY --from=descarga /tmp/dl/motor/ /opt/xash/
COPY --from=events /build/package/addons/ /opt/xash/addons/
COPY --from=events /build/dingus_events.so /opt/xash/addons/events/dingus_events.so
COPY entrypoint.sh /usr/local/bin/servidor-cs
COPY on-demand.sh /usr/local/bin/cs-demand
RUN chmod 755 /usr/local/bin/cs-demand /usr/local/bin/servidor-cs /opt/xash/xash3d && chown -R xash:xash /opt/xash
USER xash
WORKDIR /opt/xash
ENV LD_LIBRARY_PATH=/opt/xash
ENTRYPOINT ["/usr/local/bin/servidor-cs"]
