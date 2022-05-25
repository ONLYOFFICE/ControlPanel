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


while [ "$1" != "" ]; do
	case $1 in
		-i | --image )
			IMAGE=$2
			shift
		;;

		-path | --imagepath )
			IMAGEPATH=$2
			shift
		;;

		-v | --version )
			VERSION=$2
			shift
		;;

		-hub | --hub )
			HUB=$2
			shift
		;;

		-u | --username )
			USERNAME=$2
			shift
		;;

		-p | --password )
			PASSWORD=$2
			shift
		;;

		-ei | --elasticimage )
			ELASTICSEARCH_IMAGE=$2
			shift
		;;

		-ec | --elastic )
			ELASTICSEARCH_CONTAINER_NAME=$2
			shift
		;;	

		-cc | --community )
			COMMUNITY_CONTAINER_NAME=$2
			shift
		;;

		-? | -h | --help )
			echo "  Usage $0 [PARAMETER] [[PARAMETER], ...]"
			echo "    Parameters:"
			echo "      -i, --image         image"
			echo "      -path, --imagepath  image path"
			echo "      -v, --version       image version"
			echo "      -hub, --hub         dockerhub name"
			echo "      -u, --username      dockerhub username"
			echo "      -p, --password      dockerhub password"
			echo "      -ei, --elasticimage elasticsearch image name"
			echo "      -ec, --elastic      elasticsearch container name"
			echo "      -cc, --community    communityserver container name"
			echo "      -?, -h, --help      this help"
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

if [ "$IMAGE" == "" ]; then
	echo "image name is empty"
	exit 1
fi

if [ -n "$IMAGEPATH" ]; then
	ARCHIVE=$(find "$IMAGEPATH" -name "${IMAGE//\//-}_$VERSION.tar.gz" -type f -printf "%f\n" | sort -r | head -n 1);
	if [[ -n "$ARCHIVE" ]]; then
			sudo docker load < "$IMAGEPATH$ARCHIVE";
			exit 0;
	fi
fi

if [[ -n ${USERNAME} && -n ${PASSWORD} ]]; then
	sudo docker login ${HUB} --username ${USERNAME} --password ${PASSWORD}
fi

sudo docker pull $IMAGE:$VERSION

#Download elasticsearch image when downloading communityserver
if [[ -n ${COMMUNITY_CONTAINER_NAME} ]]; then
	ELASTICSEARCH_SERVER_HOST=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${COMMUNITY_CONTAINER_NAME} | grep "ELASTICSEARCH_SERVER_HOST=" | sed 's/^.*=//');
	#Check that elasticsearch host is not external
	if [[ -z ${ELASTICSEARCH_SERVER_HOST} || ${ELASTICSEARCH_SERVER_HOST} = ${ELASTICSEARCH_CONTAINER_NAME} ]]; then
		ELASTICSEARCH_VERSION=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${IMAGE}:${VERSION} | grep "ELASTICSEARCH_VERSION=" | sed 's/^.*=//');
		sudo docker pull ${ELASTICSEARCH_IMAGE}:${ELASTICSEARCH_VERSION}
	fi
fi

exit 0;