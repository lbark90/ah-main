#!/bin/bash

# Install Python and pip if needed
echo "Checking for Python..."
if ! command -v python3 &> /dev/null; then
    echo "Python3 not found, installing..."
    apt-get update
    apt-get install -y python3 python3-pip
else
    echo "Python3 is already installed"
fi

# Install Google Cloud libraries for Node.js
echo "Installing Google Cloud libraries for Node.js..."
npm install --save google-auth-library @google-cloud/storage

# Install Google Cloud libraries for Python
echo "Installing Google Cloud libraries for Python..."
pip3 install --upgrade google-cloud-storage google-cloud-speech

echo "All dependencies installed successfully"
