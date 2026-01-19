#!/bin/bash
cd /home/kavia/workspace/code-generation/smartnote-suite-200983/frontend_web
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

