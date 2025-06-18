#!/bin/bash
cd /home/kavia/workspace/code-generation/githubactivitydashboard-111274-1614b8f2/githubactivitydashboard
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

