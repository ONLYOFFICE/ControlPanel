#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

cd ${DIR}

sed 's/http:\/\/onlyoffice-community-server/http:\/\/'${ONLYOFFICE_COMMUNITYSERVER_HOST}'/' -i www/config/production.json;
sed "/core\.machinekey/s!\"core\.machinekey\".*!\"core\.machinekey\":\"${ONLYOFFICE_CORE_MACHINEKEY}\",!" -i www/config/production.json;
if [[ ${HIDDEN_COMPONENTS} ]]; then
  sed "/hiddenControllers/s/\"hiddenControllers\".*/\"hiddenControllers\":\[${HIDDEN_COMPONENTS}\],/" -i www/config/production.json;
else
  sed '/hiddenControllers/s/"hiddenControllers".*/"hiddenControllers":\[\],/' -i www/config/production.json;
fi

exec /usr/bin/supervisord
