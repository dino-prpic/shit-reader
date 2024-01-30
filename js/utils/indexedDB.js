import { get, set } from 'https://unpkg.com/idb-keyval@5.0.2/dist/esm/index.js';

const DB = {};

DB.getRecent = async () => {
    try {
        const handle = await get('recentFile');
        return handle;
    } catch (error) {
        return null;
    }
};

DB.setRecent = async (folderHandle) => {
    try {
        await set('recentFile', folderHandle);
    } catch (error) {
        console.log(error);
    }
};

export default DB


