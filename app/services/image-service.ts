import { ImageSource, ImageAsset, isAndroid, Folder, knownFolders, path } from '@nativescript/core';
import { request, RequestPermission } from '@nativescript/permissions';

export class ImageService {
    private static readonly STORAGE_PATH = 'wardrobe_images';

    async captureImage(): Promise<string> {
        try {
            await this.requestPermissions();
            const camera = require('@nativescript/camera').Camera;
            const imageAsset = await camera.takePicture();
            return await this.saveImage(imageAsset);
        } catch (error) {
            console.error('Camera error:', error);
            throw new Error('Failed to capture image');
        }
    }

    async pickFromGallery(): Promise<string> {
        try {
            await this.requestPermissions();
            const imagepicker = require('@nativescript/imagepicker');
            const context = imagepicker.create({ mode: 'single' });
            const selection = await context.present();
            if (selection.length > 0) {
                return await this.saveImage(selection[0]);
            }
            throw new Error('No image selected');
        } catch (error) {
            console.error('Gallery error:', error);
            throw new Error('Failed to pick image');
        }
    }

    private async requestPermissions(): Promise<void> {
        if (isAndroid) {
            await request(RequestPermission.CAMERA);
            await request(RequestPermission.READ_EXTERNAL_STORAGE);
            await request(RequestPermission.WRITE_EXTERNAL_STORAGE);
        }
    }

    private async saveImage(imageAsset: ImageAsset): Promise<string> {
        const imageSource = await ImageSource.fromAsset(imageAsset);
        const fileName = `image_${Date.now()}.jpg`;
        const folder = this.ensureFolder();
        const filePath = path.join(folder.path, fileName);
        await imageSource.saveToFile(filePath, 'jpg');
        return filePath;
    }

    private ensureFolder(): Folder {
        const documents = knownFolders.documents();
        return documents.getFolder(ImageService.STORAGE_PATH);
    }
}