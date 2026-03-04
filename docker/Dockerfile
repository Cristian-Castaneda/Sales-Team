FROM openclaw:local

USER root

# Install Bun (single binary, runs TypeScript natively)
RUN curl -fsSL https://bun.sh/install | bash

# Make Bun available in PATH for all sessions
ENV PATH="/root/.bun/bin:${PATH}"