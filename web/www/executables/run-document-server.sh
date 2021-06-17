#!/bin/bash

# (c) Copyright Ascensio System Limited 2010-2021
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
PROTOCOL='http';

while [ "$1" != "" ]; do
	case $1 in

		-u | --update )
			UPDATE=1
		;;

		-i | --image )
			if [ "$2" != "" ]; then
				DOCUMENT_IMAGE_NAME=$2
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
				DOCUMENT_CONTAINER_NAME=$2
				shift
			fi
		;;

		-cc | --communtycontainer )
			if [ "$2" != "" ]; then
				COMMUNITY_CONTAINER_NAME=$2
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

		-pr | --protocol )
			PROTOCOL=$2
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
			echo "      -u, --update         update"
			echo "      -i, --image          image name"
			echo "      -v, --version        image version"
			echo "      -c, --container      container name"
			echo "      -hub, --hub          dockerhub name"
			echo "      -un, --username      dockerhub username"
			echo "      -p, --password       dockerhub password"
			echo "      -path, --imagepath   image path"
			echo "      -pr, --protocol      protocol"
			echo "      -mysql, --mysql      mysql container name"
			echo "      -product, --product  product"
			echo "      -hostdir, --hostdir  host dir"
			echo "      -?, -h, --help       this help"
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

DIR=$(dirname $(readlink -f $0));
JWT_SECRET=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${COMMUNITY_CONTAINER_NAME} | grep "DOCUMENT_SERVER_JWT_SECRET=" | sed 's/^.*=//');

if [ "$UPDATE" == "1" ]; then
	DOCUMENT_SERVER_ID=$(sudo docker ps -aqf "name=$DOCUMENT_CONTAINER_NAME");
	JWT_SECRET=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${DOCUMENT_CONTAINER_NAME} | grep "JWT_SECRET=" | sed 's/^.*=//');
	sudo bash ${DIR}/tools/check-bindings.sh ${DOCUMENT_SERVER_ID} "/etc/$PRODUCT,/var/lib/$PRODUCT,/var/lib/postgresql,/usr/share/fonts/truetype/custom,/var/lib/rabbitmq,/var/lib/redis";
	sudo docker exec ${DOCUMENT_CONTAINER_NAME} bash /usr/bin/documentserver-prepare4shutdown.sh
	sudo bash ${DIR}/tools/remove-container.sh ${DOCUMENT_CONTAINER_NAME}
fi

if [[ -n ${USERNAME} && -n ${PASSWORD} ]]; then
	sudo docker login ${HUB} --username ${USERNAME} --password ${PASSWORD}
fi

if [[ -z ${VERSION} ]]; then
	GET_VERSION_COMMAND="sudo bash ${DIR}/tools/get-available-version.sh -i $DOCUMENT_IMAGE_NAME -path $IMAGEPATH";

	if [[ -n ${PASSWORD} && -n ${USERNAME} ]]; then
		GET_VERSION_COMMAND="$GET_VERSION_COMMAND -u $USERNAME -p $PASSWORD";
	fi

	VERSION=$(${GET_VERSION_COMMAND});
fi

args=();
args+=(--name "$DOCUMENT_CONTAINER_NAME");

if [[ -n ${JWT_SECRET} ]]; then
	args+=(-e "JWT_ENABLED=true");
	args+=(-e "JWT_HEADER=AuthorizationJwt");
	args+=(-e "JWT_SECRET=$JWT_SECRET");
fi

args+=(-v "$HOST_DIR/DocumentServer/data:/var/www/$PRODUCT/Data");
args+=(-v "$HOST_DIR/DocumentServer/logs:/var/log/$PRODUCT");
args+=("$DOCUMENT_IMAGE_NAME:$VERSION");

sudo docker run --net ${PRODUCT} -i -t -d --restart=always "${args[@]}";

sleep 5

DOCUMENT_SERVER_ID=$(sudo docker ps -aqf "name=$DOCUMENT_CONTAINER_NAME");

if [[ -n ${DOCUMENT_SERVER_ID} ]]; then
	sudo docker exec ${COMMUNITY_CONTAINER_NAME} chown -R ${PRODUCT}:${PRODUCT} /var/www/${PRODUCT}/DocumentServerData
	
	echo "DOCUMENT SERVER successfully installed."

	if [ -f "$IMAGEPATH/${DOCUMENT_IMAGE_NAME//\//-}_$VERSION.tar.gz" ]; then
		sudo rm "$IMAGEPATH/${DOCUMENT_IMAGE_NAME//\//-}_$VERSION.tar.gz";
	fi

	if [ "$UPDATE" == "0" ]; then
		sudo docker exec ${COMMUNITY_CONTAINER_NAME} cp /etc/nginx/includes/${PRODUCT}-communityserver-proxy-to-documentserver.conf.template /etc/nginx/includes/${PRODUCT}-communityserver-proxy-to-documentserver.conf
		sudo docker exec ${COMMUNITY_CONTAINER_NAME} sed 's,{{DOCUMENT_SERVER_HOST_ADDR}},'"${PROTOCOL}:\/\/${DOCUMENT_CONTAINER_NAME}"',' -i /etc/nginx/includes/${PRODUCT}-communityserver-proxy-to-documentserver.conf
		sudo docker exec ${COMMUNITY_CONTAINER_NAME} service nginx reload
	fi

	exit 0;
fi

echo "DOCUMENT SERVER not installed."
exit 1;

