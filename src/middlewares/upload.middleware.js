const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const memoryStorage = multer.memoryStorage();

const csvFileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' || 
        file.mimetype === 'text/plain') { 
        cb(null, true);
    } else {
        cb(new Error('Archivo inválido. Solo se permiten archivos CSV.'), false);
    }
};

const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Archivo inválido. Solo se permiten imágenes (JPG, PNG, WEBP).'), false);
    }
};

const uploadCsv = multer({ 
    storage: memoryStorage,
    fileFilter: csvFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, 
        files: 1
    }
});

const uploadImage = multer({
    storage: diskStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, 
        files: 1
    }
});

const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
};

module.exports = {
    uploadCsv,
    uploadImage,
    handleUploadError
};