#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# O comando abaixo instala as dependências do Puppeteer no Render
# (Apenas se você não usar o Buildpack oficial)