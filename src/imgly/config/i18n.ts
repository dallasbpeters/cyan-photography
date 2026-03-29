import type CreativeEditorSDK from '@cesdk/cesdk-js';

export function setupTranslations(cesdk: CreativeEditorSDK): void {
  cesdk.i18n.setTranslations({
    en: {
      'libraries.ly.img.sticker.label': 'Stickers',
      'libraries.ly.img.vector.shape.label': 'Shapes',
      'libraries.ly.img.text.label': 'Text',
    },
  });
}
