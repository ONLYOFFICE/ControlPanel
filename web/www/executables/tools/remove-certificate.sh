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


CONTAINER_NAME=$1
shift
PRODUCT=$1
shift
CRT_PATH=$1
shift

sudo docker exec $CONTAINER_NAME rm -rf $CRT_PATH 2>/dev/null

SCRIPT_PATH="/var/www/$PRODUCT/Tools/default-$PRODUCT.sh"

if [[ -n $(sudo docker exec $CONTAINER_NAME ls $SCRIPT_PATH 2>/dev/null) ]]; then
	sudo docker exec $CONTAINER_NAME bash $SCRIPT_PATH &>/dev/null
	exit 0;
fi

sudo docker exec $CONTAINER_NAME /app/$PRODUCT/run-community-server.sh
exit 0;
