#!/bin/bash
set -e

# Check if DevSpace is installed, install if not
if ! command -v devspace &> /dev/null
then
    echo "DevSpace not found, installing..."
    brew install devspace
else
    echo "DevSpace already installed."
fi

# Configure DevSpace
devspace use context sirol-emporium
devspace use namespace docs
devspace deploy
