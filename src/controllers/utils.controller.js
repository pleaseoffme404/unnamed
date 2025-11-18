const fs = require('fs').promises;
const path = require('path');

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
        console.error("Error al crear directorio", e);
    }

    const savePath = path.join(saveDir, filename);
    
    await fs.writeFile(savePath, file.buffer);
    
    return `/assets/img/${folder}/${filename}`;
};

const deleteImage = async (imageUrl) => {
    if (!imageUrl) return;
    try {
        const filePath = path.join(__dirname, '..', '..', 'public', imageUrl);
        await fs.unlink(filePath);
    } catch (err) {
        
    }
};

module.exports = {
    slugify,
    saveImage,
    deleteImage
};