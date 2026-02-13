FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# Rimuovi la configurazione di default
RUN rm /etc/nginx/conf.d/default.conf
# Copia la tua configurazione
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copia i file buildati
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]