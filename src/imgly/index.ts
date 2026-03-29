import CreativeEditorSDK from '@cesdk/cesdk-js';

import {
  BlurAssetSource,
  ColorPaletteAssetSource,
  CropPresetsAssetSource,
  EffectsAssetSource,
  FiltersAssetSource,
  PagePresetsAssetSource,
  StickerAssetSource,
  TextAssetSource,
  TextComponentAssetSource,
  TypefaceAssetSource,
  VectorShapeAssetSource,
} from '@cesdk/cesdk-js/plugins';

import { PhotoEditorConfig } from './config/plugin';

export { PhotoEditorConfig } from './config/plugin';

export async function initPhotoEditor(cesdk: CreativeEditorSDK) {
  await cesdk.addPlugin(new PhotoEditorConfig());

  cesdk.ui.setTheme('dark');

  await cesdk.addPlugin(new BlurAssetSource());
  await cesdk.addPlugin(new ColorPaletteAssetSource());
  await cesdk.addPlugin(new CropPresetsAssetSource());
  await cesdk.addPlugin(new EffectsAssetSource());
  await cesdk.addPlugin(new FiltersAssetSource());
  await cesdk.addPlugin(new PagePresetsAssetSource());
  await cesdk.addPlugin(new StickerAssetSource());
  await cesdk.addPlugin(new TextAssetSource());
  await cesdk.addPlugin(new TextComponentAssetSource());
  await cesdk.addPlugin(new TypefaceAssetSource());
  await cesdk.addPlugin(new VectorShapeAssetSource());

  cesdk.i18n.setTranslations({
    en: { 'actions.export.image': 'Export Image' },
  });

  cesdk.ui.insertOrderComponent(
    { in: 'ly.img.navigation.bar', position: 'end' },
    {
      id: 'ly.img.action.navigationBar',
      key: 'actions.export.image',
      color: 'accent',
      icon: '@imgly/Image',
      label: 'actions.export.image',
      onClick: async () => {
        await cesdk.actions.run('exportDesign', { mimeType: 'image/png' });
      },
    }
  );
}
