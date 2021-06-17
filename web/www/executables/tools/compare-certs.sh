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


function trimStart(){
   data=$(sed '/[BEGIN,END]/s/^[ \t]*//' < $1)
   echo "$data" > $1
}

trimStart $1
trimStart $2

CRTHASH=$(openssl x509 -in $1 -modulus -noout | openssl md5)
KEYHASH=$(openssl rsa -in $2 -modulus -noout | openssl md5)

if [[ "$CRTHASH" = "$KEYHASH" ]]; then
        echo true;
        exit 0;
fi
echo false;
exit 0;
