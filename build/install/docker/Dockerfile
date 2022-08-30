FROM ubuntu:22.04

ARG ONLYOFFICE_ROOT_DIR="/var/www/onlyoffice/controlpanel"
ARG RELEASE_DATE="2020-07-07" 
ARG RELEASE_DATE_SIGN="" 
ARG VERSION="2.9.0.93"

ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    NODE_ENV=production \
    ONLYOFFICE_COMMUNITYSERVER_HOST=onlyoffice-community-server \
    ONLYOFFICE_CORE_MACHINEKEY="Vskoproizvolny Salt par Chivreski"

RUN mkdir -p ${ONLYOFFICE_ROOT_DIR}

ADD run-controlpanel.sh ${ONLYOFFICE_ROOT_DIR}

COPY www ${ONLYOFFICE_ROOT_DIR}

LABEL onlyoffice.controlpanel.release-date="${RELEASE_DATE}" \
      onlyoffice.controlpanel.version="${VERSION}" \
      onlyoffice.controlpanel.release-date.sign="${RELEASE_DATE_SIGN}"  \
      description="Control Panel is an open-source component that provides tools to quickly configure and administrate self-hosted ONLYOFFICE, including backups, updates, and data encryption." \
      maintainer="Ascensio System SIA <support@onlyoffice.com>" \
      securitytxt="https://www.onlyoffice.com/.well-known/security.txt"

RUN ls -l ${ONLYOFFICE_ROOT_DIR} && \
    apt-get -y update && \
    apt-get -y upgrade && \
    apt-get install -yq sudo \
                        gpg \
                        locales \
                        wget \
                        curl \
                        htop \
                        nano \
                        apt-transport-https \
                        jq && \
    DEBIAN_FRONTEND=noninteractive  && \
    locale-gen en_US.UTF-8 && \
    echo "#!/bin/sh\nexit 0" > /usr/sbin/policy-rc.d && \
    echo "" >> /etc/init.d/cgroup-lite && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash - && \
    apt-get install -yq nodejs \
                        supervisor \
                        docker-ce=5:20.10.16~3-0~ubuntu-jammy && \
    chmod -R a+x ${ONLYOFFICE_ROOT_DIR}/www/executables && \
    chmod a+x ${ONLYOFFICE_ROOT_DIR}/run-controlpanel.sh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY config/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
    
VOLUME ["/var/log/onlyoffice"]

EXPOSE 80 443

WORKDIR ${ONLYOFFICE_ROOT_DIR}

ENTRYPOINT ["/var/www/onlyoffice/controlpanel/run-controlpanel.sh"]
