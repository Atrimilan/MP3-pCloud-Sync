import { fileFromPath } from 'formdata-node/file-from-path';
import dotenv from 'dotenv';

dotenv.config();

const PCLOUD_API = process.env.PCLOUD_API || 'https://eapi.pcloud.com'; // European API by default
const FORM_URL_ENCODED_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' };

/**
 * Authenticate to pCloud
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
 * @param {*} folderid Parent folder ID
 * @param {*} filePath Path to the file to upload
 * @param {*} newFilename Optional new filename for the uploaded file
 * @returns 
 */
export async function uploadFile(auth, filePath, folderid, newFilename = null) {
    const form = new FormData();
    form.append('auth', auth);
    form.append('folderid', folderid);
    if (newFilename) {
        form.append('file', await fileFromPath(filePath), newFilename);
    } else {
        form.append('file', await fileFromPath(filePath));
    }

    const response = await fetch(`${PCLOUD_API}/uploadfile`, {
        method: 'POST',
        body: form
        // Content-Type multipart/form-data is automatically set
    });

    const data = await response.json();
    if (!data.metadata) {
        throw new Error('Upload error: ' + (data.error || 'Unknown error'));
    }

    return data.metadata;
}
