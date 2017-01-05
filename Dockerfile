FROM debian:jessie
MAINTAINER Dion Amago Whitehead

#######################################
# General tools needed by multiple sections below
#######################################
RUN apt-get update \
    && apt-get install -y \
      wget \
      curl && \
  apt-get -y clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#######################################
# Node/npm
#######################################

RUN apt-get update && \
    apt-get install -y g++ g++-multilib libgc-dev git python build-essential && \
    curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
    apt-get -y install nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm install -g forever nodemon grunt grunt-cli webpack

# #######################################
# # Client build/install packages
# #######################################
ENV APP /app
RUN mkdir -p $APP/shared
ADD ./shared/ $APP/shared/
RUN mkdir -p $APP/client
WORKDIR $APP/client

ADD client/package.json $APP/client/package.json
RUN npm install

RUN touch .env
ADD ./client/.babelrc $APP/client/.babelrc
ADD ./client/.eslintignore $APP/client/.eslintignore
ADD ./client/.eslintrc $APP/client/.eslintrc
ADD ./client/karma.conf.js $APP/client/karma.conf.js
ADD ./client/README.md $APP/client/README.md
ADD ./client/webpack.config.js $APP/client/webpack.config.js
ADD ./client/public $APP/client/public
ADD ./client/test $APP/client/test

RUN npm run build


#######################################
# Server build/install packages
#######################################
RUN mkdir -p $APP/server
WORKDIR $APP/server

ADD ./server/ $APP/server/ 
RUN npm install

ADD ./server/package.json $APP/server/package.json
RUN cd $APP/server && npm install
ADD ./server/bin $APP/server/bin
ADD ./server/**.js $APP/server/
ADD ./server/**.json $APP/server/

WORKDIR $APP
RUN cp ./server/VERSION $APP/ || true

ENV PORT 4000
EXPOSE $PORT

CMD ["forever", "server/bin/www"]
