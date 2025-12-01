const { body, query, validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }
    next();
};

const loginValidator = [
    body('correo').isEmail().withMessage('El correo electrónico no es válido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
    validateResult
];

const loginMobileValidator = [
    body('boleta').notEmpty().withMessage('La boleta es requerida')
        .isLength({ min: 10, max: 10 }).withMessage('La boleta debe tener 10 dígitos'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
    validateResult
];

const alumnoValidator = [
    body('nombres').trim().notEmpty().withMessage('El nombre es requerido'),
    body('apellido_paterno').trim().notEmpty().withMessage('El apellido paterno es requerido'),
    body('curp')
        .toUpperCase()
        .matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/)
        .withMessage('Formato de CURP inválido (debe tener 18 caracteres)'),
    body('boleta')
        .trim()
        .isLength({ min: 10, max: 10 }).withMessage('La boleta debe tener exactamente 10 dígitos')
        .isNumeric().withMessage('La boleta solo debe contener números'),
    body('nss')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 11, max: 11 }).withMessage('El NSS debe tener exactamente 11 dígitos')
        .isNumeric().withMessage('El NSS solo debe contener números'),
    body('fecha_nacimiento')
        .isISO8601().withMessage('Fecha de nacimiento inválida')
        .custom((value) => {
            const fecha = new Date(value);
            const hoy = new Date();
            if (fecha > hoy) {
                throw new Error('La fecha de nacimiento no puede ser futura');
            }
            return true;
        }),
    body('tipo_sangre')
        .optional({ checkFalsy: true })
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Tipo de sangre no válido'),
    body('correo_electronico').trim().isEmail().withMessage('Correo electrónico inválido'),
    body('telefono')
        .optional({ checkFalsy: true })
        .isMobilePhone().withMessage('Número de teléfono inválido'),
    body('contrasena')
        .if(body('contrasena').exists())
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validateResult
];

const tutorValidator = [
    body('nombres').trim().notEmpty().withMessage('El nombre es requerido'),
    body('apellido_paterno').trim().notEmpty().withMessage('El apellido paterno es requerido'),
    body('correo_electronico').trim().isEmail().withMessage('Correo electrónico inválido'),
    body('telefono').trim().isMobilePhone().withMessage('Número de teléfono inválido'),
    body('contrasena')
        .if(body('contrasena').exists())
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validateResult
];

const reporteValidator = [
    query('fechaInicio').isISO8601().withMessage('Fecha inicio inválida'),
    query('fechaFin').isISO8601().withMessage('Fecha fin inválida')
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.query.fechaInicio)) {
                throw new Error('La fecha fin no puede ser menor a la fecha inicio');
            }
            return true;
        }),
    validateResult
];

const changePasswordValidator = [
    body('oldPassword').notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
    validateResult
];

module.exports = {
    loginValidator,
    loginMobileValidator,
    alumnoValidator,
    tutorValidator,
    reporteValidator,
    changePasswordValidator
};