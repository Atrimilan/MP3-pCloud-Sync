import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFolder, listFolder, login, uploadFileWithProgress } from './pcloud_service.js';

dotenv.config();

/**
 * Log an error message and exit the process
 * 
 * @param {*} message Error message
 */
function logErrorAndExit(message) {
    console.error(`Error: ${message}`);
    process.exit(1);
}

/* First check if the .env file exists */

const { PCLOUD_USERNAME, PCLOUD_PASSWORD, PCLOUD_API } = process.env;

if (!PCLOUD_USERNAME || !PCLOUD_PASSWORD || !PCLOUD_API) {
    logErrorAndExit('Missing required environment variables in .env file');
}

/* Then retrieve the list of backup paths from backup_paths.json */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupPaths = JSON.parse(fs.readFileSync(path.join(__dirname, 'backup_paths.json'), 'utf-8'));

if (backupPaths.length === 0) {
    logErrorAndExit('No backup paths found in backup_paths.json');
}

/* Ensure there is exactly one .zip file in each backup path */

const localFolders = [];

for (const backupPath of backupPaths) {
    if (!fs.existsSync(backupPath)) {
        logErrorAndExit(`Backup path does not exist: ${backupPath}`);
    }

    const files = fs.readdirSync(backupPath).filter(file => file.endsWith('.zip'));
    if (files.length === 0) {
        logErrorAndExit(`No .zip files found in backup path: ${backupPath}`);
    }
    if (files.length > 1) {
        logErrorAndExit(`Multiple .zip files found in backup path: ${backupPath}. Only one file is expected.`);
    }

    // Add the folder to the localFolders array
    localFolders.push({
        name: path.basename(path.dirname(backupPath)),
        path: path.join(backupPath, files[0]) // Full path to the .zip file
    });
}

/* Then execute the full process to publish backup files to pCloud */

(async () => {
    try {
        // Authentication if needed
        const authFilePath = path.join(__dirname, 'auth_token.txt');
        let auth;
        if (fs.existsSync(authFilePath)) {
            auth = fs.readFileSync(authFilePath, 'utf-8').trim();
        } else {
            auth = await login(PCLOUD_USERNAME, PCLOUD_PASSWORD);
            fs.writeFileSync(authFilePath, auth, 'utf-8'); // Save the auth token for future use
            console.log('Authentication token has been saved to auth_token.txt');
        }

        // List remote folders on pCloud
        const remoteFolders = (await listFolder(auth, 0))
            .filter(item => item.isfolder)
            .filter(f => f.name !== 'System Volume Information') // Exclude the "System Volume Information" pCloud folder
            .map(f => ({ name: f.name, id: f.folderid }));

        // Create remote folders that do not exist
        for (const folder of localFolders) {
            const folderName = folder.name;

            if (!remoteFolders.find(f => f.name === folderName)) {
                const folderid = await createFolder(auth, folderName, 0);
                remoteFolders.push({ name: folderName, id: folderid }); // Add the newly created folder to the remoteFolders array
                console.log(`Folder created on pCloud: ${folderName}`);
            }
        }

        // Upload files to remote folders
        for (const folder of localFolders) {
            const folderName = folder.name;
            const zipFilePath = folder.path;

            const remoteFolder = remoteFolders.find(f => f.name === folderName); // Find the corresponding remote folder
            if (!remoteFolder) {
                logErrorAndExit(`Remote folder not found for local folder: ${folderName}`);
            }

            const newFilename = `backup_${folderName.toLocaleLowerCase()}.zip`; // Define a new filename
            await uploadFileWithProgress(auth, zipFilePath, remoteFolder.id, newFilename, (percent, loadedMB, totalMB) => {
                 console.log(`Backup ${folderName} : ${percent}% (${loadedMB}/${totalMB} MB)`);
                 if (percent === 100) {
                     console.log("Waiting for server confirmation, please don't close the application...");
                 }
            });
            console.log(`File uploaded to pCloud: ${zipFilePath} in folder ${folderName}`);
        }

        // Applause
        console.log('Backup synchronization completed successfully.');

    } catch (err) {
        console.error(err);
    }
})();
