/**
 * Load root `.env` before Expo evaluates config / Metro inlines `EXPO_PUBLIC_*`.
 * Use `KEY=value` lines only (no `export`). Files live next to this script (project root).
 */
const path = require('path');

const root = __dirname;
require('dotenv').config({ path: path.join(root, '.env') });
require('dotenv').config({ path: path.join(root, '.env.local'), override: true });

module.exports = require('./app.json');
