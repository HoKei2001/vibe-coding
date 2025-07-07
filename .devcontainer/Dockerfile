FROM python:3.12
# here i pick python:3.xx instead of our base on ACR
# becuase the base on ACR is amd64
# then arm machines will have issues
ENV PYTHONUNBUFFERED 1
# to prevent run as root
ARG DOCKER_HOME="/opt/python-user"
ARG DOCKER_CODE="/opt/python-user/code"
ARG DOCKER_GROUP="python-user"
ARG DOCKER_USER="python-user"
ARG DOCKER_UID=5000

ENV ZSH="/opt/python-user/.oh-my-zsh"

WORKDIR ${DOCKER_CODE}

RUN groupadd -g ${DOCKER_UID} ${DOCKER_GROUP} \
    && useradd -r -u ${DOCKER_UID} -g ${DOCKER_GROUP} -d ${DOCKER_HOME} ${DOCKER_USER} \
    && chown -R ${DOCKER_USER}:${DOCKER_GROUP} ${DOCKER_HOME}

RUN apt-get update && \
    apt-get install -y curl && \
    apt-get install -y git && \
    apt-get install -y openssh-client && \
    pip install --upgrade pip && \
    pip install poetry==2.0.1 && \
    poetry config virtualenvs.create false

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest

# Install zsh, omz, plugins
RUN apt-get install -y zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# will add examples to install our own python modules
# maybe not via git+ssh, well we will decide later if we have any
RUN mkdir ${DOCKER_HOME}/.ssh && \
    chown -R ${DOCKER_USER} ${DOCKER_HOME}/.ssh && \
    ssh-keyscan github.com >> ${DOCKER_HOME}/.ssh/known_hosts

ENV PATH "$PATH:/opt/python-user/.local/bin"
ENV PYTHONPATH=.

USER ${DOCKER_USER}
ENTRYPOINT [ "/bin/sh", "-c" ]