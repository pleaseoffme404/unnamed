const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const PUBLIC_URL = process.env.PUBLIC_URL || 'https://endware.bullnodes.com';

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

const saveImage = async (file, folder, name) => {
    const slug = slugify(name) || 'imagen';
    const extension = path.extname(file.originalname);
    const filename = `${slug}-${Date.now()}${extension}`;
    
    const saveDir = path.join(__dirname, '..', '..', 'public', 'assets', 'img', folder);
    
    try {
        await fs.mkdir(saveDir, { recursive: true });
    } catch (e) {
        console.error(e);
    }

    const savePath = path.join(saveDir, filename);
    await fs.writeFile(savePath, file.buffer);
    
    return `${PUBLIC_URL}/assets/img/${folder}/${filename}`;
};

const deleteImage = async (imageUrl) => {
    if (!imageUrl) return;
    
    let relativePath = imageUrl;
    if (imageUrl.startsWith('http')) {
        relativePath = imageUrl.replace(PUBLIC_URL, '');
    }

    try {
        const filePath = path.join(__dirname, '..', '..', 'public', relativePath);
        await fs.unlink(filePath);
    } catch (err) {
        
    }
};

module.exports = {
    slugify,
    saveImage,
    deleteImage
};