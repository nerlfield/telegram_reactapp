# Stage: development
FROM node:18-alpine as development

WORKDIR /app

# Install dependencies for development
COPY package*.json ./
RUN npm install

# Copy all files for development with hot reloading via volume mounts
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

# Stage: builder (for production)
FROM node:18-alpine as builder

WORKDIR /app

# Install dependencies and build the production app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage: production
FROM nginx:alpine as production

# Copy built files from builder stage to nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 