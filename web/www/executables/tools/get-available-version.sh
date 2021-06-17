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

		-path | --imagepath )
			IMAGEPATH=$2
			shift
		;;

		-o | --offline )
			OFFLINE=$2
			shift
		;;

		-? | -h | --help )
			echo "  Usage $0 [PARAMETER] [[PARAMETER], ...]"
			echo "    Parameters:"
			echo "      -i, --image         image"
			echo "      -hub, --hub         hub"
			echo "      -u, --username      username"
			echo "      -p, --password      password"
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

command_exists () {
    type "$1" &> /dev/null;
}

if [ "$IMAGE" == "" ]; then
	echo "image name is empty"
	exit 1
fi

if [ -n "$IMAGEPATH" ]; then
	if [ ! -d "$IMAGEPATH" ]; then
		mkdir $IMAGEPATH
	fi

	ARCHIVE=$(find "$IMAGEPATH" -name "${IMAGE//\//-}*.tar.gz" -type f -printf "%f\n" | sort -r | head -n 1);
	if [[ -n "$ARCHIVE" ]]; then
			echo `expr match "$ARCHIVE" "${IMAGE//\//-}_"'\(.*\).tar.gz'`;
			exit 0;
	fi
fi

if [ "$OFFLINE" != "" ]; then
	exit 0;
fi

if ! command_exists jq ; then
	sudo apt-get install -yq jq
fi

CREDENTIALS="";
AUTH_HEADER="";
TAGS_RESP="";

if [[ -n ${HUB} ]]; then
	DOCKER_CONFIG="$HOME/.docker/config.json";

	if [[ -f "$DOCKER_CONFIG" ]]; then
		CREDENTIALS=$(jq -r '.auths."'$HUB'".auth' < "$DOCKER_CONFIG");
		if [ "$CREDENTIALS" == "null" ]; then
			CREDENTIALS="";
		fi
	fi

	if [[ -z ${CREDENTIALS} && -n ${USERNAME} && -n ${PASSWORD} ]]; then
		CREDENTIALS=$(echo -n "$USERNAME:$PASSWORD" | base64);
	fi

	if [[ -n ${CREDENTIALS} ]]; then
		AUTH_HEADER="Authorization: Basic $CREDENTIALS";
	fi

	REPO=$(echo $1 | sed "s/$HUB\///g");
	TAGS_RESP=$(curl -s -H "$AUTH_HEADER" -X GET https://$HUB/v2/$REPO/tags/list);
	TAGS_RESP=$(echo $TAGS_RESP | jq -r '.tags')
else
	if [[ -n ${USERNAME} && -n ${PASSWORD} ]]; then
		CREDENTIALS="{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}";
	fi

	if [[ -n ${CREDENTIALS} ]]; then
		LOGIN_RESP=$(curl -s -H "Content-Type: application/json" -X POST -d "$CREDENTIALS" https://hub.docker.com/v2/users/login/)
		TOKEN=$(echo $LOGIN_RESP | jq -r '.token')
		AUTH_HEADER="Authorization: JWT $TOKEN"
		sleep 1;
	fi

	TAGS_RESP=$(curl -s -H "$AUTH_HEADER" -X GET https://hub.docker.com/v2/repositories/$IMAGE/tags/);
	TAGS_RESP=$(echo $TAGS_RESP | jq -r '.results[].name')
fi

VERSION_REGEX_1="[0-9]+\.[0-9]+\.[0-9]+"
VERSION_REGEX_2="[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+"
TAG_LIST=""

for item in $TAGS_RESP
do
	if [[ $item =~ $VERSION_REGEX_1 ]] || [[ $item =~ $VERSION_REGEX_2 ]]; then
		TAG_LIST="$item,$TAG_LIST"
	fi
done

LATEST_TAG=$(echo $TAG_LIST | tr ',' '\n' | sort -t. -k 1,1n -k 2,2n -k 3,3n -k 4,4n | awk '/./{line=$0} END{print line}');

echo $LATEST_TAG
exit 0;