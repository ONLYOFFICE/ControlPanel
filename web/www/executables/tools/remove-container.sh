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


CONTAINER_NAME=$1;
FAST_REMOVE=$2;

if [[ -z ${CONTAINER_NAME} ]]; then
	echo "Empty container name"
	exit 0;
fi

if [ "$FAST_REMOVE" == "true" ]; then
	echo "fast remove container:"
	docker rm -f ${CONTAINER_NAME};
else
	echo "stop container:"
	docker stop ${CONTAINER_NAME};
	echo "remove container:"
	docker rm ${CONTAINER_NAME};
fi

sleep 10 #Hack for SuSe: exception "Error response from daemon: devmapper: Unknown device xxx"

echo "check removed container:"
CONTAINER_ID=$(docker ps -aqf "name=$CONTAINER_NAME");

if [[ -n ${CONTAINER_ID} ]]; then
	echo "try again remove ${CONTAINER_NAME}"
	remove_container ${CONTAINER_NAME}
fi

exit 0;
