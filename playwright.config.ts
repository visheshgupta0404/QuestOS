import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e',fullyParallel:false,workers:1,timeout:60000,use:{baseURL:'http://localhost:3000',headless:true,screenshot:'only-on-failure'},webServer:{command:'npm run dev',url:'http://localhost:3000',reuseExistingServer:!process.env.CI,timeout:120000}});
