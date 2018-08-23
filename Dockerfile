FROM node:8-alpine
LABEL author="Virgil <support@VirgilSecurity.com>"
ARG git_commit
RUN apk add --no-cache --update ca-certificates
# required for virgil-crypto
RUN apk add libc6-compat

# Add package.json and then install dependncies
# so that `npm install` is only run if package.json changes
COPY package.json .
COPY package-lock.json .

# Install app dependencies
RUN npm install --production

# Bundle app files
COPY server.js .
COPY src src/

ENV PORT 3000
ENV GIT_COMMIT $git_commit

EXPOSE 3000

CMD [ "npm", "start" ]