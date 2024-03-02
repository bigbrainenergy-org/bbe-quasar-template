FROM node:lts

COPY . /home/node/app
RUN npm install
RUN npm run build
CMD ["npm", "start"]