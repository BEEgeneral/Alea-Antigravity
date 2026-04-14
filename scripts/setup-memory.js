#!/usr/bin/env node

/**
 * Alea Signature - Memory System Setup
 * 
 * This script helps set up the memory tables in InsForge.
 * 
 * Usage:
 *   node scripts/setup-memory.js
 * 
 * Or manually via InsForge UI/SQL Editor:
 *   Copy contents of scripts/memory-migration.sql and execute in InsForge
 */

const fs = require('fs');
const path = require('path');

const MIGRATION_FILE = path.join(__dirname, 'memory-migration.sql');

async function main() {
    console.log('🏛️  Alea Memory System Setup');
    console.log('===========================\n');

    // Check if migration file exists
    if (!fs.existsSync(MIGRATION_FILE)) {
        console.error('❌ Migration file not found:', MIGRATION_FILE);
        process.exit(1);
    }

    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    console.log('📋 Memory Tables to Create:\n');
    
    // Extract table names
    const tables = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/g) || [];
    tables.forEach(t => {
        const name = t.replace('CREATE TABLE IF NOT EXISTS ', '');
        console.log('   •', name);
    });

    console.log('\n📝 Options to Execute:\n');
    
    console.log('1️⃣  Via InsForge UI (RECOMMENDED):');
    console.log('   • Go to: https://if8rkq6j.eu-central.insforge.app');
    console.log('   • Navigate to: Database > SQL Editor');
    console.log('   • Copy the contents of scripts/memory-migration.sql');
    console.log('   • Paste and execute\n');

    console.log('2️⃣  Via InsForge CLI:');
    console.log('   • insforge db execute --file scripts/memory-migration.sql\n');

    console.log('3️⃣  Via Supabase CLI (if linked):');
    console.log('   • supabase db execute < scripts/memory-migration.sql\n');

    console.log('⚠️  IMPORTANT:');
    console.log('   • Backup your database before running migrations');
    console.log('   • The memory_wings, memory_rooms, memory_drawers tables');
    console.log('     will be created if they don\'t exist (IF NOT EXISTS)\n');

    // Ask for confirmation
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question('Do you want to see the full SQL? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
            console.log('\n📄 Full SQL:\n');
            console.log(sql);
        }
        readline.close();
    });
}

main().catch(console.error);
