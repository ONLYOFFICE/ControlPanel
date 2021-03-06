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
		-k | --key )
			KEY=$2
			shift
		;;
		
		-c | --certificate )
			CERTIFICATE=$2
			shift
		;;
		
		-r | --request )
			REQUEST=$2
			shift
		;;

		-? | -h | --help )
			echo "  Usage $0 [PARAMETER] [[PARAMETER], ...]"
			echo "    Parameters:"
			echo "      -k, --key               key file name"
			echo "      -c, --certificate       certificate file name"
			echo "      -r, --request           request file name"
			echo "      -?, -h, --help        this help"
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

openssl genrsa -out $KEY 2048 &>/dev/null
openssl req -new -subj '/' -key $KEY -out $REQUEST &>/dev/null
openssl x509 -req -days 365 -in $REQUEST -signkey $KEY -out $CERTIFICATE &>/dev/null

exit 0;