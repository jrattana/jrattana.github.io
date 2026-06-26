#!/bin/bash
cd /Users/jericarattana/Documents/Claude/Projects/Portfolio
exec python3 -m http.server ${PORT:-8080}
