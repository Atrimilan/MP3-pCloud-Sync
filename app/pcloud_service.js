import axios from 'axios';
import dotenv from 'dotenv';
import FormData from "form-data";
import fs from 'fs';
import https from 'https';

dotenv.config();

const PCLOUD_API = process.env.PCLOUD_API || 'https://eapi.pcloud.com'; // European API by default
const FORM_URL_ENCODED_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' };

const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 10000, // Ping every 10 seconds to keep the connection alive
    timeout: 0
});

/**
 * Authenticate to pCloud. **See README.md for more information about the first login process.**
 * 
 * @param {*} username
 * @param {*} password
 * @returns 
 */
export async function login(username, password) {
    const params = new URLSearchParams({ username, password });

    const response = await fetch(`${PCLOUD_API}/login`, {
        method: 'POST',
        body: params,
        headers: FORM_URL_ENCODED_HEADERS
    });

    const data = await response.json();
    if (!data.auth) {
        if (data.error === 'Please provide \'code\'.') {
            throw new Error(
                'When running this script for the first time, you must log in to your browser at the following address: https://my.pcloud.com/, and complete the two-factor authentication process. ' +
                'This ensures that pCloud recognizes your IP address when running the script. ' +
                'Subsequent runs of the script will use a non-expiring token, avoiding the need to log in manually.'
            );
        }
        throw new Error('Authentication failed: ' + (data.error || 'Unknown error'));
    }

    return data.auth;
}

/**
 * List folder contents
 * 
 * @param {*} auth Authentication token
 * @param {*} folderid Parent folder ID (if not specified, defaults to root folder)
 * @returns 
 */
export async function listFolder(auth, folderid = 0) {
    const params = new URLSearchParams({ auth, folderid });

    const response = await fetch(`${PCLOUD_API}/listfolder`, {
        method: 'POST',
        body: params,
        headers: FORM_URL_ENCODED_HEADERS
    });

    const data = await response.json();
    if (!data.metadata) {
        throw new Error('Cannot list folder contents: ' + (data.error || 'Unknown error'));
    }

    return data.metadata.contents;
}

/**
 * Create a folder
 * 
 * @param {*} auth Authentication token
 * @param {*} name Name of the folder to create
 * @param {*} folderid Parent folder ID (if not specified, defaults to root folder)
 * @returns 
 */
export async function createFolder(auth, name, folderid = 0) {
    const params = new URLSearchParams({ auth, name, folderid });

    const response = await fetch(`${PCLOUD_API}/createfolder`, {
        method: 'POST',
        body: params,
        headers: FORM_URL_ENCODED_HEADERS
    });

    const data = await response.json();
    if (!data.metadata) {
        throw new Error('Cannot create folder: ' + (data.error || 'Unknown error'));
    }

    return data.metadata.folderid;
}

/**
 * Upload a file to pCloud
 * 
 * @param {*} auth Authentication token
 * @param {*} filePath Path to the file to upload
 * @param {*} folderid Parent folder ID
 * @param {*} newFilename Optional new filename for the uploaded file
 * @param {*} onProgress Callback function to track upload progress
 * @returns 
 */
export async function uploadFileWithProgress(auth, filePath, folderid, newFilename = null, onProgress = null) {
    const form = new FormData();

    form.append('auth', auth);
    form.append('folderid', folderid);

    const stream = fs.createReadStream(filePath);
    const fileSize = fs.statSync(filePath).size;

    if (newFilename) {
        form.append('file', stream, { filename: newFilename, knownLength: fileSize });
    } else {
        form.append('file', stream, { knownLength: fileSize });
    }

    const response = await axios.post(`${PCLOUD_API}/uploadfile`, form,
        {
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 0,
            httpsAgent,
            onUploadProgress: progressEvent => {
                if (onProgress) {
                    const percent = Math.round((progressEvent.loaded * 100) / fileSize); // Percentage of upload completion
                    const loadedMB = Math.round(progressEvent.loaded / (1024 * 1024)); // Loaded file size in MB
                    const totalMB = Math.round(fileSize / (1024 * 1024)); // Total file size in MB
                    onProgress(percent, loadedMB, totalMB);
                }
            }
        }
    );

    if (!response.data.metadata) {
        throw new Error('Upload error: ' + (response.data.error || 'Unknown error'));
    }

    return response.data.metadata;
}
