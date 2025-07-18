#!/usr/bin/env node

import { DbEncryptionMigrator } from '../utilities/db-encryption-migrator.js'
import { log } from '../functions/logger.js'
import readline from 'readline'

/**
 * Command-line tool to migrate unencrypted data to encrypted format
 */
async function main() {
    console.log('=== Mellow Bot Database Encryption Migration Tool ===')
    console.log('This tool will migrate unencrypted sensitive data to encrypted format.')
    console.log('Only unencrypted data will be processed - already encrypted data will be preserved.\n')

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    // Ask user for confirmation
    const dryRun = await new Promise(resolve => {
        rl.question('Would you like to perform a dry run first? (y/n): ', answer => {
            resolve(answer.toLowerCase() === 'y')
        })
    })

    if (dryRun) {
        console.log('\nPerforming DRY RUN - no changes will be made to the database.')
    } else {
        console.log('\n⚠️ WARNING: This will modify your database! Make sure you have a backup before proceeding.')

        const confirmed = await new Promise(resolve => {
            rl.question('Are you sure you want to continue? (yes/no): ', answer => {
                resolve(answer.toLowerCase() === 'yes')
            })
        })

        if (!confirmed) {
            console.log('Migration cancelled.')
            rl.close()
            return
        }
    }

    console.log('\nStarting migration process...')

    try {
        const migrator = new DbEncryptionMigrator()
        const startTime = Date.now()

        // Run the migration
        const results = await migrator.migrateAll({
            dryRun,
            batchSize: 100
        })

        // Close the database connection
        await migrator.close()

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)

        // Display results
        console.log('\n=== Migration Results ===')
        console.log(`Completed in ${duration} seconds\n`)

        let totalProcessed = 0
        let totalEncrypted = 0

        for (const result of results) {
            if (result.error) {
                console.log(`❌ ${result.model}: Error - ${result.error}`)
            } else {
                console.log(
                    `✅ ${result.model}: Processed ${result.processedRecords} records, encrypted ${result.encryptedRecords} fields`
                )
                totalProcessed += result.processedRecords
                totalEncrypted += result.encryptedRecords
            }
        }

        console.log(`\nTotal: Processed ${totalProcessed} records, encrypted ${totalEncrypted} fields`)

        if (dryRun) {
            console.log('\nThis was a dry run. No changes were made to the database.')
            console.log('To perform the actual migration, run this script again and select "n" for dry run.')
        } else {
            console.log('\nMigration completed successfully.')
        }
    } catch (error) {
        console.error('\n❌ Migration failed:')
        console.error(error)
    } finally {
        rl.close()
    }
}

// Run the migration
main().catch(console.error)
