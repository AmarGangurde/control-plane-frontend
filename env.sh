#!/bin/sh

# Generate a config file for the browser to consume at runtime
echo "window._env_ = {" > /usr/share/nginx/html/env-config.js

# list all env vars that start with VITE_
env | grep '^VITE_' | while read -r line; do
  # Extract key and value
  key=$(echo "$line" | cut -d '=' -f 1)
  value=$(echo "$line" | cut -d '=' -f 2-)
  
  # Append to the config file
  echo "  $key: \"$value\"," >> /usr/share/nginx/html/env-config.js
done

echo "};" >> /usr/share/nginx/html/env-config.js

# Execute the original CMD
exec "$@"
