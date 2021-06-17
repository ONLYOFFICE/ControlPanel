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

while [ "$1" != "" ]; do
	case $1 in

		-u | --update )
			UPDATE=1
		;;

		-i | --image )
			if [ "$2" != "" ]; then
				CONTROLPANEL_IMAGE_NAME=$2
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
				CONTROLPANEL_CONTAINER_NAME=$2
				shift
			fi
		;;

		-cc | --communitycontainer )
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


DIR=$(dirname $(readlink -f $0));
CORE_MACHINEKEY=$(sudo bash ${DIR}/tools/get-machinekey.sh $CONTROLPANEL_CONTAINER_NAME $COMMUNITY_CONTAINER_NAME $PRODUCT);
MACHINEKEY_PARAM=$(echo "${PRODUCT}_CORE_MACHINEKEY" | awk '{print toupper($0)}');

if [ "$UPDATE" == "1" ]; then
	CONTROL_PANEL_ID=$(sudo docker ps -aqf "name=$CONTROLPANEL_CONTAINER_NAME");
	sudo bash ${DIR}/tools/check-bindings.sh ${CONTROL_PANEL_ID} "/var/lib/mysql";
	echo "Rename CONTROL PANEL."
	OLD_CONTROLPANEL_CONTAINER_NAME="${CONTROLPANEL_CONTAINER_NAME}_$RANDOM";
	sudo docker rename ${CONTROLPANEL_CONTAINER_NAME} ${OLD_CONTROLPANEL_CONTAINER_NAME};
fi

if [[ -n ${USERNAME} && -n ${PASSWORD} ]]; then
	sudo docker login ${HUB} --username ${USERNAME} --password ${PASSWORD}
fi

if [[ -z ${VERSION} ]]; then
	GET_VERSION_COMMAND="sudo bash ${DIR}/tools/get-available-version.sh -i $CONTROLPANEL_IMAGE_NAME -path $IMAGEPATH";

	if [[ -n ${PASSWORD} && -n ${USERNAME} ]]; then
		GET_VERSION_COMMAND="$GET_VERSION_COMMAND -u $USERNAME -p $PASSWORD";
	fi

	VERSION=$(${GET_VERSION_COMMAND});
fi

args=();
args+=(--name "$CONTROLPANEL_CONTAINER_NAME");

if [[ -n ${CORE_MACHINEKEY} ]]; then
	args+=(-e "$MACHINEKEY_PARAM=$CORE_MACHINEKEY");
fi

args+=(-v "/var/run/docker.sock:/var/run/docker.sock");
args+=(-v "$HOST_DIR/CommunityServer/data:/app/$PRODUCT/CommunityServer/data");
args+=(-v "$HOST_DIR/ControlPanel/data:/var/www/$PRODUCT/Data");
args+=(-v "$HOST_DIR/ControlPanel/logs:/var/log/$PRODUCT");
args+=("$CONTROLPANEL_IMAGE_NAME:$VERSION");

sudo docker run --net $PRODUCT -i -t -d --restart=always "${args[@]}";

sleep 5

CONTROL_PANEL_ID=$(sudo docker ps -aqf "name=$CONTROLPANEL_CONTAINER_NAME");

if [[ -n ${CONTROL_PANEL_ID} ]]; then
	echo "CONTROL PANEL successfully installed."

	if [ -f "$IMAGEPATH/${CONTROLPANEL_IMAGE_NAME//\//-}_$VERSION.tar.gz" ]; then
		sudo rm "$IMAGEPATH/${CONTROLPANEL_IMAGE_NAME//\//-}_$VERSION.tar.gz";
	fi

	if [[ -n ${OLD_CONTROLPANEL_CONTAINER_NAME} ]]; then
		sudo docker exec ${COMMUNITY_CONTAINER_NAME} service nginx restart
		sudo bash ${DIR}/tools/remove-container.sh ${OLD_CONTROLPANEL_CONTAINER_NAME} true
	fi

	exit 0;
fi

echo "CONTROL PANEL not installed."
exit 1;