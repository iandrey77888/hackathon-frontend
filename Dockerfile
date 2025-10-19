FROM node:18.20.4

COPY . /app

WORKDIR /app
RUN npm install
RUN npx expo export -p web

EXPOSE 8081
ENTRYPOINT ["npx", "expo", "serve", "--port", "8090"]
