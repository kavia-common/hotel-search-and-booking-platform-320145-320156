#!/bin/bash
cd /home/kavia/workspace/code-generation/hotel-search-and-booking-platform-320145-320156/hotel_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

