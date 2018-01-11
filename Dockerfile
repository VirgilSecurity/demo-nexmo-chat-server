FROM node:6-alpine
MAINTAINER Virgil <support@VirgilSecurity.com>
ARG git_commit
RUN apk add --no-cache --update ca-certificates

# Add package.json and then install dependncies
# so that `npm install` is only run if package.json changes
COPY package.json .

# Install app dependencies
RUN npm install --production

# Bundle app files
COPY bin bin/
COPY config config/
COPY routes routes/
COPY services services/
COPY app.js .

ENV PORT 3000
ENV GIT_COMMIT $git_commit

EXPOSE 3000

CMD [ "npm", "start" ]