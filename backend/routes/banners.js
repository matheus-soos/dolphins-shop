const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads/banners');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        const tipo = file.fieldname; // heroBanners ou secondaryBanners
        const folder = tipo === 'heroBanners' ? 'hero' : 'secondary';
        const uploadPath = path.join(__dirname, "..", 'uploads', 'banners', folder);

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1E9);

        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Apenas imagens são permitidas'));
        }
        cb(null, true);
    }
});

router.post('/',
    upload.fields([
        { name: 'heroBanners' },
        { name: 'secondaryBanners' }
    ]),
    (req, res) => {

        const heroBanners = req.files['heroBanners'] || [];
        const secondaryBanners = req.files['secondaryBanners'] || [];

        res.json({
            message: 'Upload realizado com sucesso',
            maior: heroBanners.map(f => f.filename),
            menor: secondaryBanners.map(f => f.filename)
        });
    }
);

router.get('/', (req, res) => {

    const heroPath = path.join(__dirname, '../uploads/banners/hero');
    const secondaryPath = path.join(__dirname, '../uploads/banners/secondary');

    const hero = fs.existsSync(heroPath)
        ? fs.readdirSync(heroPath)
        : [];

    const secondary = fs.existsSync(secondaryPath)
        ? fs.readdirSync(secondaryPath)
        : [];

    res.json({
        hero,
        secondary
    });
});

module.exports = router;