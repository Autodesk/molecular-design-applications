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
RUN mkdir -p $APP/molecule_viewer
ADD ./molecule_viewer/ $APP/molecule_viewer/
RUN mkdir -p $APP/shared
ADD ./shared/ $APP/shared/
WORKDIR $APP/shared
RUN npm install
RUN npm run build
WORKDIR $APP

RUN mkdir -p $APP/client
WORKDIR $APP/client

ADD client/package.json $APP/client/package.json
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
ADD ./shared $APP/shared

RUN npm run build


#######################################
# Server build/install packages
#######################################
RUN mkdir -p $APP/server
ADD ./server/package.json $APP/server/package.json
WORKDIR $APP/server
RUN npm install

# ADD ./server $APP/server
RUN touch .env
RUN echo "NODE_ENV=production" > .env

# RUN cd $APP/server && npm install
ADD ./server/bin $APP/server/bin
ADD ./server/constants $APP/server/constants
ADD ./server/etc $APP/server/etc
ADD ./server/main $APP/server/main
ADD ./server/public $APP/server/public
ADD ./server/routes $APP/server/routes
ADD ./server/test $APP/server/test
ADD ./server/utils $APP/server/utils
ADD ./server/views $APP/server/views
ADD ./server/**.json $APP/server/

ADD ./VERSION $APP/server/

ENV PORT 4000
EXPOSE $PORT

CMD ["forever", "bin/www"]
