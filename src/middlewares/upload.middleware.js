const multer = require('multer');

const memoryStorage = multer.memoryStorage();

const csvFileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no válido. Solo se acepta CSV.'), false);
    }
};

const imageFileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(new Error('Formato de imagen no válido. Solo se acepta JPG, JPEG o PNG.'), false);
    }
};

const uploadCsv = multer({ 
    storage: memoryStorage,
    fileFilter: csvFileFilter 
});

const uploadImage = multer({
    storage: memoryStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 1024 * 1024 * 5 }
});

module.exports = {
    uploadCsv,
    uploadImage
};