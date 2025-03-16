#!/usr/bin/env sh

# This script changes all " VUE_APP_API_URL: "" " entries inside /dist folder to the same VUE_APP_API_URL but including API_URL env value
# That way it's possible to change API URL after the image is built, change while running the container
# read as find all .js files inside /dist folder and use stream editor for each of them
# "s" - substitute pattern 1 with pattern 2 (patterns separated by comma), change all occurrences ("g")
# when searching a range of letters, numbers, strings to search dash literally it must be put either at the end or at the start inside []

find "${PWD}" -name '*.js' -exec sed -i -e 's,VUE_APP_API_URL:\"[a-z0-9:./\"-]*\",'VUE_APP_API_URL:\"${API_URL}\"',g' {} \;