# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Apache + PHP 8.2 Production Backend
FROM php:8.2-apache

# Install SQLite dev headers and PHP extensions (PDO MySQL + PDO SQLite)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsqlite3-dev \
    && docker-php-ext-install pdo pdo_mysql pdo_sqlite \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Enable AllowOverride for .htaccess mod_rewrite routing
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Set DocumentRoot directory
WORKDIR /var/www/html

# 1. Serve frontend single-page application at root (/)
COPY --from=frontend-builder /app/frontend/dist /var/www/html

# 2. Serve PHP backend API at (/api)
COPY backend/ /var/www/html/api/

# 3. Database schema, seeds, and SQLite persistence
COPY database/ /var/www/html/database/

# Ensure runtime directories exist with appropriate write permissions
RUN mkdir -p /var/www/html/api/cache/tts \
    && mkdir -p /var/www/html/api/cache/ratelimit \
    && mkdir -p /var/www/html/database \
    && chown -R www-data:www-data /var/www/html/database /var/www/html/api/cache \
    && chmod -R 775 /var/www/html/database /var/www/html/api/cache

EXPOSE 80

CMD ["apache2-foreground"]
