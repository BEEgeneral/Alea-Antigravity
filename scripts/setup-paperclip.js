#!/usr/bin/env node

/**
 * Alea Signature - Paperclip Setup
 * 
 * This script helps set up Paperclip for Alea Signature.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AGENTS_DIR = path.join(__dirname, '../paperclip/agents');

async function main() {
    console.log('🤖 Alea Signature - Paperclip Setup');
    console.log('==================================\n');

    // Check prerequisites
    console.log('🔍 Checking prerequisites...\n');

    // Check Node.js
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        console.log('   ✅ Node.js:', nodeVersion);
    } catch {
        console.log('   ❌ Node.js not found. Install from https://nodejs.org');
        process.exit(1);
    }

    // Check pnpm
    try {
        const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
        console.log('   ✅ pnpm:', pnpmVersion);
    } catch {
        console.log('   ⚠️  pnpm not found. Installing...');
        try {
            execSync('npm install -g pnpm', { stdio: 'inherit' });
        } catch {
            console.log('   ❌ Could not install pnpm. Run: npm install -g pnpm');
        }
    }

    // Check Paperclip
    try {
        const paperclipVersion = execSync('npx paperclipai --version 2>/dev/null || echo "not installed"', { encoding: 'utf8' }).trim();
        console.log('   📦 Paperclip AI:', paperclipVersion);
    } catch {
        console.log('   ⚠️  Paperclip not installed');
    }

    console.log('\n📁 Agent Configuration:');
    console.log('   Path:', AGENTS_DIR);
    
    if (fs.existsSync(AGENTS_DIR)) {
        const files = fs.readdirSync(AGENTS_DIR, { recursive: true });
        files.forEach(f => {
            if (f.endsWith('.json') || f.endsWith('.md')) {
                console.log('   •', f);
            }
        });
    }

    console.log('\n📋 Setup Steps:\n');

    console.log('1️⃣  INSTALL PAPERCLIP:');
    console.log('   npx paperclipai onboard --yes\n');

    console.log('2️⃣  CONFIGURE FOR ALEA:');
    console.log('   cd paperclip (after install)');
    console.log('   paperclipai configure\n');

    console.log('3️⃣  IMPORT AGENTS:');
    console.log('   Copy paperclip/agents/ to your Paperclip config directory\n');

    console.log('4️⃣  SETUP DATABASE:');
    console.log('   Paperclip uses its own PostgreSQL for agent state.');
    console.log('   Default: embedded SQLite (for dev)');
    console.log('   Production: configure external PostgreSQL\n');

    console.log('5️⃣  START PAPERCLIP:');
    console.log('   paperclipai dev\n');

    console.log('🌐 Paperclip will run at: http://localhost:3100\n');

    console.log('📊 Then in Alea Signature .env.local add:');
    console.log('   PAPERCLIP_API_URL=http://localhost:3100');
    console.log('   PAPERCLIP_API_KEY=your-api-key\n');

    console.log('⚠️  NOTE:');
    console.log('   • Paperclip runs SEPARATELY from Alea Signature');
    console.log('   • Alea Signature connects to Paperclip via HTTP API');
    console.log('   • Both can run on the same machine for development\n');
}

main().catch(console.error);
