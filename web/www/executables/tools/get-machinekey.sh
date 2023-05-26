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


CORE_MACHINEKEY="";
CONTROLPANEL_CONTAINER_NAME=$1
COMMUNITY_CONTAINER_NAME=$2
PRODUCT=$3
MACHINEKEY_PARAM=$(echo "${PRODUCT}_CORE_MACHINEKEY" | awk '{print toupper($0)}');

command_exists () {
    type "$1" &> /dev/null;
}

file_exists () {
	if [ -z "$1" ]; then
		echo "file path is empty"
		exit 1;
	fi

	if [ -f "$1" ]; then
		return 0; #true
	else
		return 1; #false
	fi
}

get_container_env_parameter () {
	CONTAINER_NAME=$1;
	PARAMETER_NAME=$2;
	VALUE="";

	if [[ -z ${CONTAINER_NAME} ]]; then
		echo "Empty container name"
		exit 1;
	fi

	if [[ -z ${PARAMETER_NAME} ]]; then
		echo "Empty parameter name"
		exit 1;
	fi

	if command_exists docker ; then
		CONTAINER_EXIST=$(docker ps -aqf "name=$CONTAINER_NAME");

		if [[ -n ${CONTAINER_EXIST} ]]; then
			VALUE=$(docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' ${CONTAINER_NAME} | grep "${PARAMETER_NAME}=" | sed 's/^.*=//');
		fi
	fi

	echo "$VALUE"
}

get_core_machinekey () {
	CURRENT_CORE_MACHINEKEY="";

	if [[ -z ${CORE_MACHINEKEY} ]]; then
		if file_exists /app/$PRODUCT/CommunityServer/data/.private/machinekey; then
			CURRENT_CORE_MACHINEKEY=$(cat /app/$PRODUCT/CommunityServer/data/.private/machinekey);

			if [[ -n ${CURRENT_CORE_MACHINEKEY} ]]; then
				CORE_MACHINEKEY="$CURRENT_CORE_MACHINEKEY";
			fi
		fi
	fi

	if [[ -z ${CORE_MACHINEKEY} ]]; then
		CURRENT_CORE_MACHINEKEY=$(get_container_env_parameter "$CONTROLPANEL_CONTAINER_NAME" "$MACHINEKEY_PARAM");

		if [[ -n ${CURRENT_CORE_MACHINEKEY} ]]; then
			CORE_MACHINEKEY="$CURRENT_CORE_MACHINEKEY";
		fi
	fi

	if [[ -z ${CORE_MACHINEKEY} ]]; then
		CURRENT_CORE_MACHINEKEY=$(get_container_env_parameter "$COMMUNITY_CONTAINER_NAME" "$MACHINEKEY_PARAM");

		if [[ -n ${CURRENT_CORE_MACHINEKEY} ]]; then
			CORE_MACHINEKEY="$CURRENT_CORE_MACHINEKEY";
		fi
	fi
}

get_core_machinekey

echo $CORE_MACHINEKEY
exit 0;