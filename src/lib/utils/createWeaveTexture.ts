import * as THREE from 'three';

export const createHerringboneTexture = (): THREE.CanvasTexture => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Base
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // Threading
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const stepX = 16;
    const stepY = 16;
    const shaftCount = 8; // 8-shaft herringbone twill

    for (let y = -size; y < size * 2; y += stepY) {
        ctx.beginPath();
        for (let x = 0; x <= size; x += stepX) {
            const block = Math.floor(x / (stepX * shaftCount));
            const isUp = block % 2 === 0;
            const offset = isUp
                ? (x % (stepX * shaftCount))
                : ((stepX * shaftCount) - (x % (stepX * shaftCount)));
            ctx.lineTo(x, y + offset);
        }
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    return texture;
};
