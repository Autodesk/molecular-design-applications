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
    curl -sL https://deb.nodesource.com/setup_7.x | bash - && \
    apt-get -y install nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm install -g forever nodemon grunt grunt-cli webpack

# #######################################
# # Client build/install packages
# #######################################
ENV APP /app
RUN mkdir -p $APP

#######################################
# Molecule viewer source (until bugs are fixed)
#######################################
RUN mkdir -p $APP/molecule_viewer
ADD ./molecule_viewer/ $APP/molecule_viewer/

#######################################
# Shared source build/install packages
#######################################
ADD ./shared $APP/shared
WORKDIR $APP/shared
# https://github.com/Medium/phantomjs/issues/659
RUN npm install phantomjs-prebuilt
RUN npm install
RUN npm run build

#######################################
# Client source build/install packages
#######################################

RUN mkdir -p $APP/client
WORKDIR $APP/client

ADD client/package.json $APP/client/package.json
# https://github.com/Medium/phantomjs/issues/659
RUN npm install phantomjs-prebuilt
RUN npm install

RUN touch .env
RUN echo "NODE_ENV=production" >> .env
# Will gather (at least) .eslintignore, .eslintrc, .env (optional)
# if .env exists on the host os, it will overwrite the one created above
ADD ./client/.e*  $APP/client/
ADD ./client/.babelrc $APP/client/.babelrc

ADD ./client/karma.conf.js $APP/client/karma.conf.js
ADD ./client/README.md $APP/client/README.md
ADD ./client/webpack.config.js $APP/client/webpack.config.js
ADD ./client/public $APP/client/public
ADD ./client/test $APP/client/test

RUN npm run build

#######################################
# Server build/install packages
#######################################
ADD ./apps-data $APP/apps-data
WORKDIR $APP/apps-data
RUN npm install

RUN mkdir -p $APP/server
ADD ./server/package.json $APP/server/package.json
WORKDIR $APP/server
RUN npm install

RUN touch .env
ADD ./server/.e*  $APP/server/
RUN echo "NODE_ENV=production" >> .env
ADD ./server/bin $APP/server/bin
ADD ./server/constants $APP/server/constants
ADD ./server/etc $APP/server/etc
ADD ./server/main $APP/server/main
ADD ./server/public $APP/server/public
ADD ./server/routes $APP/server/routes
ADD ./server/services $APP/server/services
ADD ./server/test $APP/server/test
ADD ./server/utils $APP/server/utils
ADD ./server/views $APP/server/views
ADD ./server/**.json $APP/server/

ADD ./VERSION $APP/server/

#######################################
# Final docker config
#######################################

ENV PORT 4000
EXPOSE $PORT

CMD ["forever", "bin/www"]
