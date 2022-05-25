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
		-f | --from )
			if [ "$2" != "" ]; then
				FROM=$2
				shift
			fi
		;;

		-t | --to )
			if [ "$2" != "" ]; then
				TO=$2
				shift
			fi
		;;

		-cc | --communtycontainer )
			if [ "$2" != "" ]; then
				COMMUNITY_CONTAINER_NAME=$2
				shift
			fi
		;;

		* )
			echo "Unknown parameter $1" 1>&2
			exit 1
		;;
	esac
	shift
done

sudo docker cp "${FROM}" ${COMMUNITY_CONTAINER_NAME}:"${TO}"
sudo rm -rf "${FROM}"