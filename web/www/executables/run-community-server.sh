#!/bin/bash

# (c) Copyright Ascensio System Limited 2010-2020
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


UPDATE=0
REFRESH=0
COMMUNITY_PORT=80

while [ "$1" != "" ]; do
	case $1 in

		-u | --update )
			UPDATE=1
		;;

		-r | --refresh )
			REFRESH=1
		;;

		-i | --image )
			if [ "$2" != "" ]; then
				COMMUNITY_IMAGE_NAME=$2
				shift
			fi
		;;

		-v | --version )
			if [ "$2" != "" ]; then
				VERSION=$2
				shift
			fi
		;;

		-c | --container )
			if [ "$2" != "" ]; then
				COMMUNITY_CONTAINER_NAME=$2
				shift
			fi
		;;

		-dc | --documentcontainer )
			if [ "$2" != "" ]; then
				DOCUMENT_CONTAINER_NAME=$2
				shift
			fi
		;;

		-mc | --mailcontainer )
			if [ "$2" != "" ]; then
				MAIL_CONTAINER_NAME=$2
				shift
			fi
		;;

		-cc | --controlpanelcontainer )
			if [ "$2" != "" ]; then
				CONTROLPANEL_CONTAINER_NAME=$2
				shift
			fi
		;;

		-hub | --hub )
			if [ "$2" != "" ]; then
				HUB=$2
				shift
			fi
		;;

		-un | --username )
			if [ "$2" != "" ]; then
				USERNAME=$2
				shift
			fi
		;;

		-p | --password )
			if [ "$2" != "" ]; then
				PASSWORD=$2
				shift
			fi
		;;

		-path | --imagepath )
			IMAGEPATH=$2
			shift
		;;

		-mysql | --mysql )
			MYSQL_CONTAINER_NAME=$2
			shift
		;;

		-product | --product )
			PRODUCT=$2
			shift
		;;

		-hostdir | --hostdir )
			HOST_DIR=$2
			shift
		;;

		-? | -h | --help )
			echo "  Usage $0 [PARAMETER] [[PARAMETER], ...]"
			echo "    Parameters:"
			echo "      -u, --update                   update"
			echo "      -r, --refresh                  refresh"
			echo "      -i, --image                    image name"
			echo "      -v, --version                  image version"
			echo "      -c, --container                container name"
			echo "      -dc, --documentcontainer       document container name"
			echo "      -mc, --mailcontainer           mail container name"
			echo "      -cc, --controlpanelcontainer   controlpanel container name"
			echo "      -hub, --hub                    dockerhub name"
			echo "      -un, --username                dockerhub username"
			echo "      -p, --password                 dockerhub password"
			echo "      -path, --imagepath             image path"
			echo "      -mysql, --mysql                mysql container name"
			echo "      -product, --product            product"
			echo "      -hostdir, --hostdir            host dir"
			echo "      -?, -h, --help                 this help"
			echo
			exit 0
		;;

		* )
			echo "Unknown parameter $1" 1>&2
			exit 1
		;;
	esac
	shift
done

MYSQL_PORT="3306";
MYSQL_HOST="$MYSQL_CONTAINER_NAME";
MYSQL_DATABASE="$PRODUCT";
MYSQL_MAIL_DATABASE="${PRODUCT}_mailserver";
MYSQL_ROOT_USER="root";
MYSQL_ROOT_PASSWORD="my-secret-pw";
MYSQL_USER="${PRODUCT}_user";
MYSQL_PASSWORD="${PRODUCT}_pass";
DIR=$(dirname $(readlink -f $0));

COMMUNITY_SERVER_ID=$(sudo docker ps -aqf "name=$COMMUNITY_CONTAINER_NAME");
DOCUMENT_SERVER_ID=$(sudo docker ps -aqf "name=$DOCUMENT_CONTAINER_NAME");
MAIL_SERVER_ID=$(sudo docker ps -aqf "name=$MAIL_CONTAINER_NAME");
CONTROL_PANEL_ID=$(sudo docker ps -aqf "name=$CONTROLPANEL_CONTAINER_NAME");
MYSQL_SERVER_ID=$(sudo docker ps -aqf "name=$MYSQL_CONTAINER_NAME");
JWT_SECRET="";
CORE_MACHINEKEY=$(sudo bash ${DIR}/tools/get-machinekey.sh $CONTROLPANEL_CONTAINER_NAME $COMMUNITY_CONTAINER_NAME $PRODUCT);
MACHINEKEY_PARAM=$(echo "${PRODUCT}_CORE_MACHINEKEY" | awk '{print toupper($0)}');

if [ "$UPDATE" == "1" ]; then
	PARAMETER_VALUE="";

	if [[ -n ${COMMUNITY_SERVER_ID} ]]; then
		PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${COMMUNITY_CONTAINER_NAME} | grep "MYSQL_SERVER_HOST" | sed 's/^.*=//');
		if [[ -n ${PARAMETER_VALUE} ]]; then
			MYSQL_HOST="$PARAMETER_VALUE";
		fi

		PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${COMMUNITY_CONTAINER_NAME} | grep "MYSQL_SERVER_ROOT_PASSWORD" | sed 's/^.*=//');
		if [[ -n ${PARAMETER_VALUE} ]]; then
			MYSQL_ROOT_PASSWORD="$PARAMETER_VALUE";
		fi

		PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${COMMUNITY_CONTAINER_NAME} | grep "MYSQL_SERVER_DB_NAME" | sed 's/^.*=//');
		if [[ -n ${PARAMETER_VALUE} ]]; then
			MYSQL_DATABASE="$PARAMETER_VALUE";
		fi

		PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${COMMUNITY_CONTAINER_NAME} | grep "MYSQL_SERVER_USER" | sed 's/^.*=//');
		if [[ -n ${PARAMETER_VALUE} ]]; then
			MYSQL_USER="$PARAMETER_VALUE";
		fi

		PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${COMMUNITY_CONTAINER_NAME} | grep "MYSQL_SERVER_PASS" | sed 's/^.*=//');
		if [[ -n ${PARAMETER_VALUE} ]]; then
			MYSQL_PASSWORD="$PARAMETER_VALUE";
		fi
	fi

	if [[ -n ${MAIL_SERVER_ID} ]]; then
		PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${MAIL_CONTAINER_NAME} | grep "MYSQL_SERVER" | sed 's/^.*=//');
		if [[ -n ${PARAMETER_VALUE} ]]; then
			MYSQL_HOST="$PARAMETER_VALUE";
		fi

		PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${MAIL_CONTAINER_NAME} | grep "MYSQL_SERVER_PORT" | sed 's/^.*=//');
		if [[ -n ${PARAMETER_VALUE} ]]; then
			MYSQL_PORT="$PARAMETER_VALUE";
		fi

		PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${MAIL_CONTAINER_NAME} | grep "MYSQL_ROOT_USER" | sed 's/^.*=//');
		if [[ -n ${PARAMETER_VALUE} ]]; then
			MYSQL_ROOT_USER="$PARAMETER_VALUE";
		fi

		PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${MAIL_CONTAINER_NAME} | grep "MYSQL_ROOT_PASSWD" | sed 's/^.*=//');
		if [[ -n ${PARAMETER_VALUE} ]]; then
			MYSQL_ROOT_PASSWORD="$PARAMETER_VALUE";
		fi

		PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${MAIL_CONTAINER_NAME} | grep "MYSQL_SERVER_DB_NAME" | sed 's/^.*=//');
		if [[ -n ${PARAMETER_VALUE} ]]; then
			MYSQL_MAIL_DATABASE="$PARAMETER_VALUE";
		fi
	fi
fi

if [[ -n ${COMMUNITY_SERVER_ID} ]]; then
	if [ "$REFRESH" == "1" ]; then
		sudo docker exec ${COMMUNITY_CONTAINER_NAME} bash /app/${PRODUCT}/run-community-server.sh;
		exit 0;
	elif [ "$UPDATE" == "1" ]; then
		sudo bash ${DIR}/tools/check-bindings.sh ${COMMUNITY_SERVER_ID} "/var/lib/mysql";

		COMMUNITY_PORT=$(sudo docker port $COMMUNITY_SERVER_ID 80 | sed 's/.*://')

		if [[ -z ${COMMUNITY_PORT} ]]; then
			COMMUNITY_PORT=80
		fi

		JWT_SECRET=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${COMMUNITY_CONTAINER_NAME} | grep "DOCUMENT_SERVER_JWT_SECRET" | sed 's/^.*=//');

		if [[ -z ${MYSQL_SERVER_ID} ]]; then
			if ! docker exec -it ${COMMUNITY_CONTAINER_NAME} service god stop; then
				echo "$COMMUNITY_CONTAINER_NAME god service could not be stopped correctly."
			fi

			if ! docker exec -it ${COMMUNITY_CONTAINER_NAME} service mysql stop; then
				echo "$COMMUNITY_CONTAINER_NAME mysql service could not be stopped correctly."
			fi
		fi

		sudo bash ${DIR}/tools/remove-container.sh ${COMMUNITY_CONTAINER_NAME}
	else
		echo "COMMUNITY SERVER is already installed."
		sudo docker start ${COMMUNITY_SERVER_ID};
		exit 0;
	fi
fi

if [[ -n ${USERNAME} && -n ${PASSWORD} ]]; then
	sudo docker login ${HUB} --username ${USERNAME} --password ${PASSWORD}
fi

if [[ -z ${VERSION} ]]; then
	GET_VERSION_COMMAND="sudo bash ${DIR}/tools/get-available-version.sh -i $COMMUNITY_IMAGE_NAME -path $IMAGEPATH";

	if [[ -n ${PASSWORD} && -n ${USERNAME} ]]; then
		GET_VERSION_COMMAND="$GET_VERSION_COMMAND -u $USERNAME -p $PASSWORD";
	fi

	VERSION=$(${GET_VERSION_COMMAND});
fi

args=();
args+=(--name "$COMMUNITY_CONTAINER_NAME")
args+=(-p "$COMMUNITY_PORT:80")
args+=(-p 443:443)
args+=(-p 5222:5222)

if [[ -n ${MYSQL_SERVER_ID} ]]; then
	args+=(-e "MYSQL_SERVER_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD");
	args+=(-e "MYSQL_SERVER_DB_NAME=$MYSQL_DATABASE");
	args+=(-e "MYSQL_SERVER_HOST=$MYSQL_HOST");
	args+=(-e "MYSQL_SERVER_USER=$MYSQL_USER");
	args+=(-e "MYSQL_SERVER_PASS=$MYSQL_PASSWORD");
else
	args+=(-v "$HOST_DIR/CommunityServer/mysql:/var/lib/mysql");
fi

if [[ -n ${DOCUMENT_SERVER_ID} ]]; then
	args+=(-e "DOCUMENT_SERVER_PORT_80_TCP_ADDR=$DOCUMENT_CONTAINER_NAME");
fi

if [[ -n ${MAIL_SERVER_ID} ]]; then
	args+=(-e "MAIL_SERVER_API_HOST=$MAIL_CONTAINER_NAME");

	if [[ -n ${MYSQL_SERVER_ID} ]]; then
		args+=(-e "MAIL_SERVER_DB_HOST=$MYSQL_HOST");
		args+=(-e "MAIL_SERVER_DB_NAME=$MYSQL_MAIL_DATABASE");
		args+=(-e "MAIL_SERVER_DB_PORT=$MYSQL_PORT");
		args+=(-e "MAIL_SERVER_DB_USER=$MYSQL_ROOT_USER");
		args+=(-e "MAIL_SERVER_DB_PASS=$MYSQL_ROOT_PASSWORD");
	else
		args+=(-e "MAIL_SERVER_DB_HOST=$MAIL_CONTAINER_NAME");
	fi
fi

if [[ -n ${CONTROL_PANEL_ID} ]]; then
	args+=(-e "CONTROL_PANEL_PORT_80_TCP=80");
	args+=(-e "CONTROL_PANEL_PORT_80_TCP_ADDR=$CONTROLPANEL_CONTAINER_NAME");
fi

if [[ -n ${JWT_SECRET} ]]; then
	args+=(-e "DOCUMENT_SERVER_JWT_ENABLED=true");
	args+=(-e "DOCUMENT_SERVER_JWT_HEADER=AuthorizationJwt");
	args+=(-e "DOCUMENT_SERVER_JWT_SECRET=$JWT_SECRET");
fi

if [[ -n ${CORE_MACHINEKEY} ]]; then
	args+=(-e "$MACHINEKEY_PARAM=$CORE_MACHINEKEY");
fi

args+=(-v "$HOST_DIR/CommunityServer/letsencrypt:/etc/letsencrypt");
args+=(-v "/sys/fs/cgroup:/sys/fs/cgroup:ro");
args+=(-v "$HOST_DIR/CommunityServer/data:/var/www/$PRODUCT/Data");
args+=(-v "$HOST_DIR/CommunityServer/logs:/var/log/$PRODUCT");
args+=(-v "$HOST_DIR/DocumentServer/data:/var/www/$PRODUCT/DocumentServerData");
args+=("$COMMUNITY_IMAGE_NAME:$VERSION");

sudo docker run --net ${PRODUCT} -itd  --privileged --restart=always "${args[@]}";

sleep 5

COMMUNITY_SERVER_ID=$(sudo docker ps -aqf "name=$COMMUNITY_CONTAINER_NAME");

if [[ -n ${COMMUNITY_SERVER_ID} ]]; then
	echo "COMMUNITY SERVER successfully installed."

	if [ -f "$IMAGEPATH/${COMMUNITY_IMAGE_NAME//\//-}_$VERSION.tar.gz" ]; then
		sudo rm "$IMAGEPATH/${COMMUNITY_IMAGE_NAME//\//-}_$VERSION.tar.gz";
	fi

	exit 0;
fi

echo "COMMUNITY SERVER not installed."
exit 1;
