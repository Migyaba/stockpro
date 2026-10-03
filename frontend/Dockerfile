FROM node:20-alpine

WORKDIR /app

# Install dependencies needed for node-gyp if necessary
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install npm dependencies
RUN npm install

# Copy project source
COPY . .

# Environment variables
ENV PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
