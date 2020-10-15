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
MAIL_DOMAIN_NAME=""

while [ "$1" != "" ]; do
	case $1 in

		-u | --update )
			UPDATE=1
		;;

		-i | --image )
			if [ "$2" != "" ]; then
				MAIL_IMAGE_NAME=$2
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
				MAIL_CONTAINER_NAME=$2
				shift
			fi
		;;

		-cc | --communtycontainer )
			if [ "$2" != "" ]; then
				COMMUNITY_CONTAINER_NAME=$2
				shift
			fi
		;;

		-d | --domain )
			if [ "$2" != "" ]; then
				MAIL_DOMAIN_NAME=$2
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
			echo "      -u, --update                update"
			echo "      -i, --image                 image name"
			echo "      -v, --version               image version"
			echo "      -c, --container             container name"
			echo "      -cc, --communitycontainer   community container name"
			echo "      -d, --domain                domain name"
			echo "      -hub, --hub                 dockerhub name"
			echo "      -un, --username             dockerhub username"
			echo "      -p, --password              dockerhub password"
			echo "      -path, --imagepath          image path"
			echo "      -mysql, --mysql             mysql container name"
			echo "      -product, --product         product"
			echo "      -hostdir, --hostdir         host dir"
			echo "      -?, -h, --help              this help"
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

MYSQL_MAIL_DATABASE="${PRODUCT}_mailserver";
MYSQL_HOST="$MYSQL_CONTAINER_NAME";
MYSQL_PORT="3306";
MYSQL_ROOT_USER="root";
MYSQL_ROOT_PASSWORD="my-secret-pw";

DIR=$(dirname $(readlink -f $0));

MYSQL_SERVER_ID=$(sudo docker ps -aqf "name=$MYSQL_CONTAINER_NAME");
COMMUNITY_SERVER_ID=$(sudo docker ps -aqf "name=$COMMUNITY_CONTAINER_NAME");

PARAMETER_VALUE="";

if [[ -n ${COMMUNITY_SERVER_ID} ]]; then
	PARAMETER_VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${COMMUNITY_CONTAINER_NAME} | grep "MYSQL_SERVER_ROOT_PASSWORD" | sed 's/^.*=//');
	if [[ -n ${PARAMETER_VALUE} ]]; then
		MYSQL_ROOT_PASSWORD="$PARAMETER_VALUE";
	fi
fi

if [ "$UPDATE" == "1" ]; then
	MAIL_SERVER_ID=$(sudo docker ps -aqf "name=$MAIL_CONTAINER_NAME");

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

	sudo bash ${DIR}/tools/check-bindings.sh ${MAIL_SERVER_ID} "/var/lib/mysql";

	if  [[ -z ${MAIL_DOMAIN_NAME} ]]; then
		MAIL_DOMAIN_NAME=$(sudo docker exec $MAIL_SERVER_ID hostname -f)
	fi

	if [[ -z ${MYSQL_SERVER_ID} ]]; then
		if ! docker exec -it ${MAIL_CONTAINER_NAME} service mysqld stop; then
			echo "$MAIL_CONTAINER_NAME mysqld service could not be stopped correctly."
		fi
	fi

	sudo bash ${DIR}/tools/remove-container.sh ${MAIL_CONTAINER_NAME}
fi

if [[ -n ${USERNAME} && -n ${PASSWORD} ]]; then
	sudo docker login ${HUB} --username ${USERNAME} --password ${PASSWORD}
fi

if [[ -z ${VERSION} ]]; then
	GET_VERSION_COMMAND="sudo bash ${DIR}/tools/get-available-version.sh -i $MAIL_IMAGE_NAME -path $IMAGEPATH";

	if [[ -n ${PASSWORD} && -n ${USERNAME} ]]; then
		GET_VERSION_COMMAND="$GET_VERSION_COMMAND -u $USERNAME -p $PASSWORD";
	fi

	VERSION=$(${GET_VERSION_COMMAND});
fi

if [ "$UPDATE" == "0" ]; then
	if  [[ -z ${MAIL_DOMAIN_NAME} ]]; then
		echo "Please, set domain name for mail server"
		exit 0;
	fi
fi

args=();
args+=(--name "$MAIL_CONTAINER_NAME")
args+=(-p 25:25)
args+=(-p 143:143)
args+=(-p 587:587)

if [[ -n ${MYSQL_SERVER_ID} ]]; then
	args+=(-e "MYSQL_SERVER=$MYSQL_HOST");
	args+=(-e "MYSQL_SERVER_PORT=$MYSQL_PORT");
	args+=(-e "MYSQL_ROOT_USER=$MYSQL_ROOT_USER");
	args+=(-e "MYSQL_ROOT_PASSWD=$MYSQL_ROOT_PASSWORD");
	args+=(-e "MYSQL_SERVER_DB_NAME=$MYSQL_MAIL_DATABASE");
else
	args+=(-v "$HOST_DIR/MailServer/mysql:/var/lib/mysql");
fi

args+=(-v "$HOST_DIR/MailServer/data:/var/vmail");
args+=(-v "$HOST_DIR/MailServer/data/certs:/etc/pki/tls/mailserver");
args+=(-v "$HOST_DIR/MailServer/logs:/var/log");
args+=(-h "$MAIL_DOMAIN_NAME");
args+=("$MAIL_IMAGE_NAME:$VERSION");

sudo docker run --net ${PRODUCT} --privileged -i -t -d --restart=always "${args[@]}";

sleep 5

MAIL_SERVER_ID=$(sudo docker ps -aqf "name=$MAIL_CONTAINER_NAME");

if [[ -n ${MAIL_SERVER_ID} ]]; then
	echo "MAIL SERVER successfully installed."

	if [ -f "$IMAGEPATH/${MAIL_IMAGE_NAME//\//-}_$VERSION.tar.gz" ]; then
		sudo rm "$IMAGEPATH/${MAIL_IMAGE_NAME//\//-}_$VERSION.tar.gz";
	fi

	if [ "$UPDATE" == "0" ]; then
		while ! sudo bash ${DIR}/tools/wait-for-it.sh  ${MAIL_CONTAINER_NAME}:25 --quiet -s -- echo "MailServer:25 is up"; do
			sleep 5
		done

		while ! sudo bash ${DIR}/tools/wait-for-it.sh  ${MAIL_CONTAINER_NAME}:8081 --quiet -s -- echo "MailServer:8081 is up"; do
			sleep 5
		done
	fi

	exit 0;
fi

echo "MAIL SERVER not installed."
exit 1;