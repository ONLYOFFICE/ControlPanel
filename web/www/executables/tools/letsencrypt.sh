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


CONTAINER_NAME=$1
shift
PRODUCT=$1
shift
FROM=$1
shift
TO=$1
shift

SCRIPT_PATH="/var/www/$PRODUCT/Tools/letsencrypt.sh"

if [[ -z $(docker exec $CONTAINER_NAME ls $SCRIPT_PATH 2>/dev/null) ]]; then
	SCRIPT_PATH="/app/$PRODUCT/assets/tools/letsencrypt.sh"
fi

docker exec $CONTAINER_NAME bash $SCRIPT_PATH "$@" &>/dev/null

docker cp ${CONTAINER_NAME}:${FROM} ${TO}

exit 0;