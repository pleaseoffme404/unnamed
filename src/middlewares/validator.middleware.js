const { body, query, validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }
    next();
};

const loginValidator = [
    body('correo').trim().escape().isEmail().withMessage('El correo electronico no es valido'),
    body('password').trim().escape().notEmpty().withMessage('La contraseña es requerida'),
    validateResult
];

const loginMobileValidator = [
    body('boleta').trim().escape().notEmpty().withMessage('La boleta es requerida')
        .isString().withMessage('La boleta debe ser texto')
        .isLength({ min: 10, max: 10 }).withMessage('La boleta debe tener 10 digitos')
        .isNumeric().withMessage('La boleta solo debe contener numeros'),
    body('password').trim().escape().notEmpty().withMessage('La contraseña es requerida'),
    validateResult
];

const alumnoValidator = [
    body('nombres').trim().escape().notEmpty().withMessage('El nombre es requerido')
        .matches(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s\.]+$/).withMessage('El nombre contiene caracteres no validos'),
    body('apellido_paterno').trim().escape().notEmpty().withMessage('El apellido paterno es requerido')
        .matches(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s\.]+$/).withMessage('El apellido contiene caracteres no validos'),
    body('curp')
        .trim().escape().toUpperCase()
        .matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/)
        .withMessage('Formato de CURP invalido (Verifica caracteres y longitud)'),
    body('boleta')
        .trim().escape()
        .isLength({ min: 10, max: 10 }).withMessage('La boleta debe tener exactamente 10 digitos')
        .isNumeric().withMessage('La boleta solo debe contener numeros'),
    body('nss')
        .optional({ checkFalsy: true })
        .trim().escape()
        .isLength({ min: 11, max: 11 }).withMessage('El NSS debe tener exactamente 11 digitos')
        .isNumeric().withMessage('El NSS solo debe contener numeros'),
    body('fecha_nacimiento')
        .trim().escape()
        .isISO8601().withMessage('Fecha de nacimiento invalida')
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
        .trim().escape()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Tipo de sangre no valido'),
    body('correo_electronico').trim().escape().isEmail().withMessage('Correo electronico invalido'),
    body('telefono')
        .optional({ checkFalsy: true })
        .trim().escape()
        .isMobilePhone().withMessage('Numero de telefono invalido')
        .isLength({ min: 10, max: 10 }).withMessage('El telefono debe tener 10 digitos'),
    body('contrasena')
        .if(body('contrasena').exists())
        .trim().escape()
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validateResult
];

const tutorValidator = [
    body('nombres').trim().escape().notEmpty().withMessage('El nombre es requerido')
        .matches(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s\.]+$/).withMessage('Nombre invalido'),
    body('apellido_paterno').trim().escape().notEmpty().withMessage('El apellido paterno es requerido')
        .matches(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s\.]+$/).withMessage('Apellido invalido'),
    body('correo_electronico').trim().escape().isEmail().withMessage('Correo electronico invalido'),
    body('telefono').trim().escape().isMobilePhone().withMessage('Numero de telefono invalido')
        .isLength({ min: 10, max: 10 }).withMessage('El telefono debe tener 10 digitos'),
    body('contrasena')
        .if(body('contrasena').exists())
        .trim().escape()
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validateResult
];

const reporteValidator = [
    query('fechaInicio').trim().escape().isISO8601().withMessage('Fecha inicio invalida'),
    query('fechaFin').trim().escape().isISO8601().withMessage('Fecha fin invalida')
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.query.fechaInicio)) {
                throw new Error('La fecha fin no puede ser menor a la fecha inicio');
            }
            return true;
        }),
    validateResult
];

const changePasswordValidator = [
    body('oldPassword').trim().escape().notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword').trim().escape().isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
    validateResult
];

const tutorAppLoginValidator = [
    body('correo')
        .trim().escape()
        .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        .withMessage('Formato de correo electrónico inválido'),
    body('password')
        .trim().escape()
        .notEmpty().withMessage('La contraseña es requerida'),
    validateResult
];

module.exports = {
    loginValidator,
    loginMobileValidator,
    alumnoValidator,
    tutorValidator,
    reporteValidator,
    changePasswordValidator,
    tutorAppLoginValidator,
    validateResult
};