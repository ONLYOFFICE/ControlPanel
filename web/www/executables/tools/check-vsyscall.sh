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


KERNEL=$(uname -r);
MIN_NUM_ARR=(4 18 0);
CUR_NUM_ARR=();

CUR_STR_ARR=$(echo $KERNEL | grep -Po "[0-9]+\.[0-9]+\.[0-9]+" | tr "." " ");
for CUR_STR_ITEM in $CUR_STR_ARR
do
    CUR_NUM_ARR=(${CUR_NUM_ARR[@]} $CUR_STR_ITEM);
done

INDEX=0;
NEED_VSYSCALL_CHECK="true";

while [[ $INDEX -lt 3 ]]; do
    if [ ${CUR_NUM_ARR[INDEX]} -lt ${MIN_NUM_ARR[INDEX]} ]; then
        NEED_VSYSCALL_CHECK="false";
        INDEX=3;
    elif [ ${CUR_NUM_ARR[INDEX]} -gt ${MIN_NUM_ARR[INDEX]} ]; then
        INDEX=3;
    fi
    (( INDEX++ ))
done

if [ "$NEED_VSYSCALL_CHECK" == "true" ]; then
    VSYSCALL_ENABLED=$(cat /proc/self/maps | egrep 'vsyscall');
    if [ -z "$VSYSCALL_ENABLED" ]; then
        echo false;
    else
        echo true;
    fi
else
    echo true;
fi

exit 0;