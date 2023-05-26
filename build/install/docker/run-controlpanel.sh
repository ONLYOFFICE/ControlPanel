#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

cd ${DIR}

sed 's/http:\/\/onlyoffice-community-server/http:\/\/'${ONLYOFFICE_COMMUNITYSERVER_HOST}'/' -i www/config/production.json;

APP_PRIVATE_DATA_DIR="/app/$(jq -r '.product.name' www/config/production.json)/CommunityServer/data/.private"
if [ ! -e "${APP_PRIVATE_DATA_DIR}/machinekey" ]; then
   mkdir -p ${APP_PRIVATE_DATA_DIR};
   APP_CORE_MACHINEKEY=${ONLYOFFICE_CORE_MACHINEKEY:-${APP_CORE_MACHINEKEY:-$(jq -r '."core.machinekey"' www/config/production.json)}};
   echo "${APP_CORE_MACHINEKEY}" > ${APP_PRIVATE_DATA_DIR}/machinekey
else
   APP_CORE_MACHINEKEY=$(head -n 1 ${APP_PRIVATE_DATA_DIR}/machinekey)
fi

find "www/config" -type f -name "*.json" -exec sed -i "s_\(\"core.machinekey\":\).*,_\1 \"${APP_CORE_MACHINEKEY}\",_" {} \;

if [[ ${HIDDEN_COMPONENTS} ]]; then
  sed "/hiddenControllers/s/\"hiddenControllers\".*/\"hiddenControllers\":\[${HIDDEN_COMPONENTS}\],/" -i www/config/production.json;
else
  sed '/hiddenControllers/s/"hiddenControllers".*/"hiddenControllers":\[\],/' -i www/config/production.json;
fi

exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
