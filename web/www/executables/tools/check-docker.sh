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


check_proc () {
  awk -F/ '$2 == "docker"' /proc/1/cgroup | read
}

check_file () {
    if [ -f /.dockerenv ]; then
        return 0;
    else
        return 1;
    fi
}

if check_proc || check_file; then
    echo true;
else
    echo false;
fi

exit 0;