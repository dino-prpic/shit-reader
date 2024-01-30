import DB from './indexedDB.js';

class ShitFile {
    handler;
    status = 'closed';
    get name() {
        return this.handler.name;
    }
    get displayName() {
        return this.handler.name.split('.').slice(0, -1).join('.');
    }
    get extension() {
        return this.handler.name.split('.').pop();
    }

    async open (handler) {
        if (!handler) handler = await window.showOpenFilePicker();
        await verifyPermission(handler, true);
        this.handler = handler;
        if (this.onOpen) this.onOpen();
        this.status = 'open';
    }
    async read(type = 'text') {
        const file = await this.handler.getFile();
        return await file[type]();
    }
    async getBlob() {
        const file = await this.handler.getFile();
        const arrayBuffer = await file.arrayBuffer();
        return arrayBuffer;
    }
    async getURL() {
        const blob = await this.getBlob();
        const url = URL.createObjectURL(new Blob([blob]));
        return url;
    }
    async write (data) {
        const writable = await this.handler.createWritable();
        console.log('writing to file', this.handler.name);
        await writable.write(data);
        await writable.close();
        console.log('done');
    }
    async delete () {
        await this.handler.remove();
        delete this;
    }

}

class ShitFolder extends Array {
    handler;
    status = 'closed';
    get name() {
        return this.handler.name;
    }

    constructor() {
        super();
    }
    
    async open (handler) {
        this.splice(0, this.length);
        if (!handler) handler = await window.showDirectoryPicker();
        await verifyPermission(handler, true);
        this.handler = handler;
        for await (const entry of handler.values()) {
            if (entry.kind === 'file') {
                const file = new ShitFile();
                await file.open(entry);
                this.push(file);
            } else {
                const folder = new ShitFolder();
                await folder.open(entry);
                this.push(folder);
            }
        }
        this.status = 'open';

        if (this.onOpen) this.onOpen();
    }

    getFiles (...allowedExtensions) {
        const files = this.filter(item => item instanceof ShitFile);
        if (allowedExtensions.length > 0) {
            return files.filter(file => allowedExtensions.includes(file.extension));
        }
        return files;
    }
    getFile (name) {
        return this.getFiles().find(item => item.name === name);
    }
    async createFile (name) {
        const file = new ShitFile();
        const handler = await this.handler.getFileHandle(name, { create: true });
        await file.open(handler);
        this.push(file);
        return file;
    }

    getFolders () {
        return this.filter(item => item instanceof ShitFolder);
    }
    getFolder (name) {
        return this.getFolders()
                   .find(item => item.name === name);
    }
    async createFolder (name) {
        const folder = new ShitFolder();
        const handler = await this.handler.getDirectoryHandle(name, { create: true });
        await folder.open(handler);
        this.push(folder);
        return folder;
    }

}

class ShitProject extends ShitFolder {
    constructor () {
        super();
    }
    onOpen () {
        DB.setRecent(this.handler);
    }
    async openRecent () {
        const recent = await DB.getRecent();
        await this.open(recent);
    }
}

async function verifyPermission(fileHandle, readWrite) {
    const options = {};
    if (readWrite) {
        options.mode = 'readwrite';
    }
    // Check if permission was already granted. If so, return true.
    if ((await fileHandle.queryPermission(options)) === 'granted') {
        return true;
    }
    // Request permission. If the user grants permission, return true.
    if ((await fileHandle.requestPermission(options)) === 'granted') {
        return true;
    }
    // The user didn't grant permission, so return false.
    return false;
}

const FS = new ShitProject();

export default FS;





