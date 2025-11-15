const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = path.join(__dirname, '../../public/assets/uploads');
        
        if (file.fieldname === 'foto_alumno') {
            uploadPath = path.join(uploadPath, 'img', 'alumnos');
        } else if (file.fieldname === 'archivo_csv') {
            uploadPath = path.join(uploadPath, 'csv');
        } else {
            uploadPath = path.join(uploadPath, 'other');
        }

        createDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'foto_alumno') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen.'), false);
        }
    } else if (file.fieldname === 'archivo_csv') {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos CSV.'), false);
        }
    } else {
        cb(new Error('Tipo de archivo no válido.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 10 }
});

module.exports = upload;