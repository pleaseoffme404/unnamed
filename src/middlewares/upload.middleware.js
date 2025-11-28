const multer = require('multer');

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
    storage: memoryStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, 
        files: 1
    }
});

const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'El archivo es demasiado grande.' });
        }
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